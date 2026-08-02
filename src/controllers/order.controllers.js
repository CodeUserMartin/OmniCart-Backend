import { ApiError } from "../utils/ApiError.utils.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import { Order } from "../models/order.models.js";
import { User } from "../models/user.models.js";
import { Product } from "../models/product.models.js";
import { Notification } from "../models/notification.models.js";
import { availableOrderStatus, orderStatusEnum } from "../constants/orderStatus.constants.js";
import { Cart } from "../models/cart.models.js";
import { userRolesEnum } from "../constants/userRoles.constants.js";
import { orderConfirmedEmailService } from "../utils/MailService.utils.js";


// Getting all the orders for a specific user (All Order, based on Category)
const getOrders = async (req, res) => {

    /*
    1. Get the User Id from the req.user_id
    2. Find the user in the Database
    3. Find the orders for the user in the Database
    4. Return the orders
    */

    const { category } = req.query;


    // User Id
    let userId = req.user._id;


    if (!userId) {
        throw new ApiError(401, "Unauthorized Request!");
    }

    // Finding the User
    const user = await User.findById(userId);


    if (!user) {
        throw new ApiError(404, "User not found!");
    }

    // Checking if the user has any orders
    const orders = await Order.find({ userId: user._id })
        .populate("items.productId");


    if (orders.length === 0) {
        throw new ApiError(404, "No orders found!");
    }

    // Formatted Order Data
    const finalOrder = orders.flatMap(order =>
        order.items
            .filter(item =>
                item.productId &&
                (!category || item.productId.category === category)
            )
            .map(item => ({
                itemId: item._id,
                productId: item.productId._id,
                img: item.productId.images,
                name: item.productId.name,
                description: item.productId.description,
                price: item.productId.price,
                quantity: item.quantity,
                status: item.orderStatus,
                category: item.productId.category,
                createdAt: order.createdAt
            }))
    );

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { finalOrder },
            "Order Fetched Succesfully!"
        ))
}

// Cart checkout and creating an order
const checkoutCart = async (req, res) => {


    /*
    1. Get the User Id from the req.user_id
    2. Look for the cart of the user in the database
    3. If the cart is empty, throw an error
    4. If the cart has items, check for the stock of each item in the cart
    5. If any item is out of stock, throw an error
    6. If all items are in stock, create an order for the user with the items in the cart
    7. Clear the cart after creating the order
    8. Return the order details in the response
    */

    const { shippingAddress, paymentMethod } = req.body;

    if (!shippingAddress) {
        throw new ApiError(400, "Shipping address is required!");
    }

    if (!paymentMethod) {
        throw new ApiError(400, "Payment method is required!");
    }

    const userId = req.user._id;

    const user = await User.findById(userId);

    // check if address already exists (avoid duplicates)
    const addressExists = user.addresses.some((addr) =>
        addr.addressLine === shippingAddress.addressLine &&
        addr.pincode === shippingAddress.pincode
    );

    if (!addressExists) {
        user.addresses.push(shippingAddress);
        await user.save();
    }

    const orderItems = [];
    let totalAmount = 0;

    // Checking if the user has any orders in the cart
    const cart = await Cart.findOne({ userId })
        .populate("items.productId");

    if (!cart || cart.items.length === 0) {
        throw new ApiError(400, "Cart is empty, cannot place order!");
    }

    for (const item of cart.items) {

        if (!item.productId) {
            throw new ApiError(404, "Product no longer exists!");
        }

        if (item.productId.stock < item.quantity) {
            throw new ApiError(400, `Insufficient stock for product ${item.productId.name}!`);
        }

        if (!item.productId.isActive) {
            throw new ApiError(400, `Product ${item.productId.name} is not active!`);
        }

        totalAmount += item.productId.price * item.quantity;

        orderItems.push({
            productId: item.productId._id,
            sellerId: item.productId.addedBy,

            name: item.productId.name,
            price: item.productId.price,
            quantity: item.quantity,

            orderStatus: "pending"
        })

        // reduce the stock of the product
        item.productId.stock -= item.quantity;
        await item.productId.save();
    }

    const order = await Order.create(
        {
            userId,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            totalAmount,
        }
    )

    // Create a notification for the user
    await Notification.create(
        {
            userId,
            title: "Order Placed",
            message: `Your order for ${order.items.length} items has been placed successfully!`,
            referenceId: order._id,
        }
    );

    // Clear the cart after placing the order
    cart.items = [];
    await cart.save();

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { order },
                "Order Placed Successfully!"
            )
        )
}

// Buying a product directly and creating an order
const buyProduct = async (req, res) => {

    const userId = req.user._id;

    const { productId } = req.params;

    const {
        quantity,
        shippingAddress,
        paymentMethod
    } = req.body;

    const user = await User.findById(userId);

    // check if address already exists (avoid duplicates)
    const addressExists = user.addresses.some((addr) =>
        addr.addressLine === shippingAddress.addressLine &&
        addr.pincode === shippingAddress.pincode
    );

    if (!addressExists) {
        user.addresses.push(shippingAddress);
        await user.save();
    }

    const qty = Number(quantity);

    // Validate quantity
    if (isNaN(qty) || qty <= 0) {
        throw new ApiError(
            400,
            "Quantity must be greater than 0!"
        );
    }

    // Validate product id
    if (!productId) {
        throw new ApiError(
            400,
            "Product Id is required!"
        );
    }



    // Find product
    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(
            404,
            "Product not found!"
        );
    }

    // Check stock
    if (product.stock < qty) {
        throw new ApiError(
            400,
            "Insufficient stock!"
        );
    }

    // Avoid Seller to purchase their own product
    if (userId.toString() === product.addedBy.toString()) {
        throw new ApiError(404, "Cannot place order for your own Product!")
    }

    const totalAmount = product.price * qty;

    // Reduce stock
    product.stock -= qty;

    await product.save();

    // Create order
    const order = await Order.create({

        userId,

        items: [
            {
                productId: product._id,

                sellerId: product.addedBy,

                name: product.name,

                price: product.price,

                quantity: qty,
            }
        ],

        totalAmount,

        shippingAddress,

        paymentMethod,

        paymentStatus: "pending",
    });

    // Create notification
    await Notification.create({
        userId,

        title: "Order Placed",

        message: `Your order for ${product.name} has been placed successfully!`,

        referenceId: order._id,
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            { order },
            "Order placed successfully!"
        )
    );
};

// Updating an order status // OLD
const updateOrderStatus = async (req, res) => {

    const { orderId } = req.params;

    const { orderStatus } = req.body;

    if (!orderId) {
        throw new ApiError(400, "Order Id is required!");
    }

    if (!orderStatus) {
        throw new ApiError(400, "Order Status is required!");
    }

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, "Order not found!");
    }

    if (!availableOrderStatus.includes(orderStatus)) {
        throw new ApiError(400, "Invalid Order Status!");
    }

    // Valid order flow transitions
    const validTransitions = {

        [orderStatusEnum.PENDING]: [
            orderStatusEnum.CONFIRMED,
            orderStatusEnum.CANCELLED,
        ],

        [orderStatusEnum.CONFIRMED]: [
            orderStatusEnum.SHIPPED,
            orderStatusEnum.CANCELLED,
        ],

        [orderStatusEnum.SHIPPED]: [
            orderStatusEnum.DELIVERED,
        ],

        [orderStatusEnum.DELIVERED]: [],

        [orderStatusEnum.CANCELLED]: [],
    };

    // Prevent invalid status flow
    if (
        !validTransitions[order.orderStatus].includes(orderStatus)
    ) {
        throw new ApiError(
            400,
            `Cannot change order from ${order.orderStatus} to ${orderStatus}`
        );
    }

    order.orderStatus = orderStatus;

    await order.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { order },
                "Order Status Updated Successfully!"
            )
        );
};

// Order status - pending
const getSellerPendingOrders = async (req, res) => {

    if (req.user.role !== userRolesEnum.SELLER) {
        throw new ApiError(
            403,
            "Only sellers can access this resource!"
        );
    }

    const orders = await Order.find({
        "items.sellerId": req.user._id,
        "items.orderStatus": orderStatusEnum.PENDING,
    }).populate("items.productId");

    const pendingOrders = [];

    orders.forEach((order) => {

        order.items.forEach((item) => {

            if (
                item.sellerId.toString() === req.user._id.toString() &&
                item.orderStatus === orderStatusEnum.PENDING
            ) {

                pendingOrders.push({
                    orderId: order._id,
                    itemId: item._id,

                    productId: item.productId?._id,
                    productName: item.name,
                    productImage: item.productId?.images?.[0],

                    quantity: item.quantity,
                    price: item.price,

                    customerId: order.userId,

                    status: item.orderStatus,

                    createdAt: order.createdAt,
                });
            }
        });

    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { pendingOrders },
            "Pending Orders fetched successfully!"
        )
    );
};

// Accept order
const acceptOrder = async (req, res) => {

    const { itemId } = req.params;

    if (req.user.role !== userRolesEnum.SELLER) {
        throw new ApiError(
            403,
            "Only sellers can accept orders!"
        );
    }

    const order = await Order.findOne({
        "items._id": itemId
    });

    if (!order) {
        throw new ApiError(
            404,
            "Order item not found!"
        );
    }

    const item = order.items.id(itemId);

    if (!item) {
        throw new ApiError(
            404,
            "Order item not found!"
        );
    }

    if (
        item.sellerId.toString() !==
        req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "Unauthorized action!"
        );
    }

    if (
        item.orderStatus !==
        orderStatusEnum.PENDING
    ) {
        throw new ApiError(
            400,
            "Only pending orders can be accepted!"
        );
    }

    item.orderStatus =
        orderStatusEnum.CONFIRMED;

    await order.save();

    await Notification.create({
        userId: order.userId,
        title: "Order Confirmed",
        message: `${item.name} has been confirmed by the seller.`,
        referenceId: order._id,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { item },
            "Order accepted successfully!"
        )
    );
};

// order status - confirm
const getSellerConfirmOrders = async (req, res) => {

    if (req.user.role !== userRolesEnum.SELLER) {
        throw new ApiError(
            403,
            "Only sellers can access this resource!"
        );
    }

    const orders = await Order.find({
        "items.sellerId": req.user._id,
        "items.orderStatus": orderStatusEnum.CONFIRMED,
    }).populate("items.productId");

    const ConfirmOrders = [];

    orders.forEach((order) => {

        order.items.forEach((item) => {

            if (
                item.sellerId.toString() === req.user._id.toString() &&
                item.orderStatus === orderStatusEnum.CONFIRMED

            ) {

                ConfirmOrders.push({
                    orderId: order._id,
                    itemId: item._id,

                    productId: item.productId?._id,
                    productName: item.name,
                    productImage: item.productId?.images?.[0],

                    quantity: item.quantity,
                    price: item.price,

                    customerId: order.userId,

                    status: item.orderStatus,

                    createdAt: order.createdAt,
                });
            }
        });

    });


    return res.status(200).json(
        new ApiResponse(
            200,
            { ConfirmOrders },
            "Confirm Orders fetched successfully!"
        )
    );
};


// Order status - shipped
const shipOrder = async (req, res) => {


    const { itemId } = req.params;

    if (req.user.role !== userRolesEnum.SELLER) {
        throw new ApiError(
            403,
            "Only sellers can ship orders!"
        );
    }

    const order = await Order.findOne({
        "items._id": itemId
    });

    if (!order) {
        throw new ApiError(
            404,
            "Order item not found!"
        );
    }

    const item = order.items.id(itemId);

    if (!item) {
        throw new ApiError(
            404,
            "Order item not found!"
        );
    }

    if (
        item.sellerId.toString() !==
        req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "Unauthorized action!"
        );
    }

    if (
        item.orderStatus !== orderStatusEnum.CONFIRMED
    ) {
        throw new ApiError(
            400,
            "Only confirmed orders can be shipped!"
        );
    }

    item.orderStatus = orderStatusEnum.SHIPPED;

    await order.save();

    await Notification.create({
        userId: order.userId,
        title: "Order Shipped",
        message: `${item.name} has been shipped and is on the way.`,
        referenceId: order._id,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { item },
            "Order shipped successfully!"
        )
    );


};


// Order status - Delivered
const deliverOrder = async (req, res) => {

    const { itemId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({
        "items._id": itemId,
        userId: userId
    });

    if (!order) {
        throw new ApiError(404, "Order item not found!");
    }

    const item = order.items.id(itemId);

    if (!item) {
        throw new ApiError(404, "Order item not found!");
    }

    // 🚨 REMOVE SELLER CHECK (important)

    if (item.orderStatus !== orderStatusEnum.SHIPPED) {
        throw new ApiError(
            400,
            "Only shipped orders can be marked as delivered!"
        );
    }

    item.orderStatus = orderStatusEnum.DELIVERED;

    await order.save();

    await Notification.create({
        userId: order.userId,
        title: "Order Delivered",
        message: `${item.name} was marked as delivered.`,
        referenceId: order._id,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { item },
            "Order marked as delivered successfully!"
        )
    );
};


// Get Shipped Orders
const getSellerShippedOrders = async (req, res) => {

    if (req.user.role !== userRolesEnum.SELLER) {
        throw new ApiError(
            403,
            "Only sellers can access this resource!"
        );
    }

    const orders = await Order.find({
        "items.sellerId": req.user._id,
        "items.orderStatus": orderStatusEnum.SHIPPED,
    }).populate("items.productId");

    const shippedOrders = [];

    orders.forEach((order) => {

        order.items.forEach((item) => {

            if (
                item.sellerId.toString() === req.user._id.toString() &&
                item.orderStatus === orderStatusEnum.SHIPPED
            ) {

                shippedOrders.push({
                    orderId: order._id,
                    itemId: item._id,

                    productId: item.productId?._id,
                    productName: item.name,
                    productImage: item.productId?.images?.[0],

                    quantity: item.quantity,
                    price: item.price,

                    customerId: order.userId,

                    status: item.orderStatus,

                    createdAt: order.createdAt,
                });
            }
        });

    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { shippedOrders },
            "Shipped orders fetched successfully!"
        )
    );


};

// Get Delivered Orders
const getSellerDeliveredOrders = async (req, res) => {

    if (req.user.role !== userRolesEnum.SELLER) {
        throw new ApiError(
            403,
            "Only sellers can access this resource!"
        );
    }

    const orders = await Order.find({
        "items.sellerId": req.user._id,
        "items.orderStatus": orderStatusEnum.DELIVERED,
    }).populate("items.productId");

    const deliveredOrders = [];

    orders.forEach((order) => {

        order.items.forEach((item) => {

            if (
                item.sellerId.toString() === req.user._id.toString() &&
                item.orderStatus === orderStatusEnum.DELIVERED
            ) {

                deliveredOrders.push({
                    orderId: order._id,
                    itemId: item._id,

                    productId: item.productId?._id,
                    productName: item.name,
                    productImage: item.productId?.images?.[0],

                    quantity: item.quantity,
                    price: item.price,

                    customerId: order.userId,

                    status: item.orderStatus,

                    createdAt: order.createdAt,
                });
            }
        });

    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { deliveredOrders },
            "Delivered orders fetched successfully!"
        )
    );


};


// Cancelling an order
const cancelOrder = async (req, res) => {

    const userId = req.user._id;
    const { itemId } = req.params;

    if (!itemId) {
        throw new ApiError(400, "Item Id is required!");
    }

    // Find order containing this item and belongs to user
    const order = await Order.findOne({
        "items._id": itemId,
        userId: userId
    });

    if (!order) {
        throw new ApiError(404, "Order not found!");
    }

    const item = order.items.id(itemId);

    if (!item) {
        throw new ApiError(404, "Order item not found!");
    }

    // Prevent invalid cancellations
    if (item.orderStatus === orderStatusEnum.SHIPPED) {
        throw new ApiError(400, "Cannot cancel after order is shipped!");
    }

    if (item.orderStatus === orderStatusEnum.DELIVERED) {
        throw new ApiError(400, "Cannot cancel after order is delivered!");
    }

    if (item.orderStatus === orderStatusEnum.CANCELLED) {
        throw new ApiError(400, "Order is already cancelled!");
    }

    // Update status
    item.orderStatus = orderStatusEnum.CANCELLED;

    await order.save();

    // OPTIONAL: Restock products
    for (const i of order.items) {
        const product = await Product.findById(i.productId);

        if (product) {
            product.stock += i.quantity;
            await product.save();
        }
    }

    // OPTIONAL: Notification (fix safe message)
    await Notification.create({
        userId,
        title: "Order Cancelled",
        message: `Your order item has been cancelled successfully.`,
        referenceId: order._id,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { item },
            "Order cancelled successfully!"
        )
    );
};


// Get Cancelled Orders
const getSellerCancelledOrders = async (req, res) => {

    if (req.user.role !== userRolesEnum.SELLER) {
        throw new ApiError(403, "Only sellers can access this resource!");
    }

    const orders = await Order.find({
        "items.sellerId": req.user._id,
        "items.orderStatus": orderStatusEnum.CANCELLED,
    }).populate("items.productId");

    const cancelledOrders = [];

    orders.forEach((order) => {

        order.items.forEach((item) => {

            if (
                item.sellerId.toString() === req.user._id.toString() &&
                item.orderStatus === orderStatusEnum.CANCELLED
            ) {

                cancelledOrders.push({
                    orderId: order._id,
                    itemId: item._id,

                    productId: item.productId?._id,
                    productName: item.name,
                    productImage: item.productId?.images?.[0],

                    description: item.productId?.description || "",

                    quantity: item.quantity,
                    price: item.price,

                    customerId: order.userId,

                    status: item.orderStatus,
                    createdAt: order.createdAt,
                });
            }
        });

    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { cancelledOrders },
            "Cancelled orders fetched successfully!"
        )
    );
};


// Seller Dashboard
const getSellerDashboard = async (req, res) => {

    let totalDeliveredProducts = 0;
    let totalCancelledProducts = 0;

    if (req.user.role !== userRolesEnum.SELLER) {
        throw new ApiError(
            403,
            "Only sellers can access this resource!"
        );
    }

    const seller = await User.findById(req.user._id);

    if (!seller) {
        throw new ApiError(
            404,
            "Seller not found!"
        );
    }

    const orders = await Order.find({
        "items.sellerId": req.user._id
    });

    let pendingOrders = 0;
    let confirmedOrders = 0;
    let shippedOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;

    let totalRevenue = 0;

    orders.forEach((order) => {

        order.items.forEach((item) => {

            if (
                item.sellerId.toString() !==
                req.user._id.toString()
            ) {
                return;
            }

            switch (item.orderStatus) {

                case orderStatusEnum.PENDING:
                    pendingOrders++;
                    break;

                case orderStatusEnum.CONFIRMED:
                    confirmedOrders++;
                    break;

                case orderStatusEnum.SHIPPED:
                    shippedOrders++;
                    break;

                case orderStatusEnum.DELIVERED:

                    deliveredOrders++;

                    totalDeliveredProducts +=
                        item.quantity;

                    totalRevenue +=
                        item.price * item.quantity;

                    break;

                case orderStatusEnum.CANCELLED:

                    cancelledOrders++;

                    totalCancelledProducts +=
                        item.quantity;

                    break;

                default:
                    break;
            }

        });

    });

    const totalProducts = await Product.countDocuments({
        addedBy: req.user._id,
        isActive: true
    });

    const dashboard = {

        sellerName:
            `${seller.firstName} ${seller.lastName}`,

        storeName:
            seller.sellerInfo?.storeName || "",

        storeAddress:
            seller.sellerInfo?.storeAddress?.addressLine || "",

        storeContact:
            seller.sellerInfo?.storeAddress?.contactNumber || "",

        pendingOrders,
        confirmedOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,

        totalProducts,

        totalDeliveredProducts,
        totalCancelledProducts,

        totalRevenue,
    };

    return res.status(200).json(
        new ApiResponse(
            200,
            { dashboard },
            "Seller dashboard fetched successfully!"
        )
    );
};



export {
    getOrders,
    checkoutCart,
    buyProduct,
    updateOrderStatus,
    cancelOrder,
    getSellerPendingOrders,
    acceptOrder,
    getSellerConfirmOrders,
    shipOrder,
    deliverOrder,
    getSellerDeliveredOrders,
    getSellerShippedOrders,
    getSellerCancelledOrders,
    getSellerDashboard
}
