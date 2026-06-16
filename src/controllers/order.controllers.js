import { ApiError } from "../utils/ApiError.utils.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import { Order } from "../models/order.models.js";
import { User } from "../models/user..models.js";
import { Product } from "../models/product.models.js";
import { Notification } from "../models/notification.models.js";
import { availableOrderStatus, orderStatusEnum } from "../constants/orderStatus.constants.js";
import { Cart } from "../models/cart.models.js";


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
    const orders = await Order.find({userId: user._id})
    .populate("items.productId");

    if (!orders) {
        throw new ApiError(404, "Orders not found!");
    }

   let items = orders.flatMap(order => order.items);

    if (category) {
        items = items.filter(
            item => item.productId.category === category
        )
    }

    // Formatted Order Data
    const finalOrder = items.map(item => ({
        productId: item.productId._id,
        img: item.productId.images,
        name: item.productId.name,
        description: item.productId.description,
        price: item.productId.price,
        quantity: item.quantity,
        status: item.orderStatus,
        category: item.productId.category,

    }))

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
            name: item.productId.name,
            price: item.productId.price,
            quantity: item.quantity,
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
    const { quantity } = req.body;

    const qty = Number(quantity);

    // Checking if the quantity is valid
    if (isNaN(qty) || qty <= 0) {
        throw new ApiError(400, "Quantity cannot be 0!");
    }

    if (!productId) {
        throw new ApiError(400, "Product Id is required!");
    }

    // Find the product in the database
    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found!");
    }

    if (product.stock < qty) {
        throw new ApiError(400, "Insufficient stock!");
    }

    const totalAmount = product.price * qty;

    product.stock -= qty;
    await product.save();

    const order = await Order.create(
        {
            userId,

            items: [
                {
                    productId: product._id,
                    name: product.name,
                    price: product.price,
                    quantity: qty,
                }
            ],
            totalAmount,
        }
    )

    // Create a notification for the user
    await Notification.create(
        {
            userId,
            title: "Order Placed",
            message: `Your order for ${product.name} has been placed successfully!`,
            referenceId: order._id,
        }
    )

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

// Updating an order status
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

// Cancelling an order
const cancelOrder = async (req, res) => {

    const userId = req.user._id;
    const { orderId } = req.params;

    if (!orderId) {
        throw new ApiError(400, "Order Id is required!");
    }

    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
        throw new ApiError(404, "Order not found!");
    }

    if (order.orderStatus === "delivered") {
        throw new ApiError(400, "Order cannot be cancelled as it is already delivered!");
    }

    if (order.orderStatus === "cancelled") {
        throw new ApiError(400, "Order is already cancelled!");
    }

    order.orderStatus = "cancelled";
    await order.save();

    // Restock the products in the order
    for (const item of order.items) {
        const product = await Product.findById(item.productId);

        if (product) {
            product.stock += item.quantity;
            await product.save();
        }
    }

    // Create a notification for the user
    await Notification.create(
        {
            userId,
            title: "Order Cancelled",
            message: `Your order for ${product.name} has been cancelled.`,
            referenceId: order._id,
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { order },
                "Order Cancelled Successfully!"
            )
        )
}


export {
    getOrders,
    checkoutCart,
    buyProduct,
    updateOrderStatus,
    cancelOrder
}
