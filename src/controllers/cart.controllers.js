import { Product } from "../models/product.models.js"
import { Cart } from "../models/cart.models.js"
import { ApiError } from "../utils/ApiError.utils.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import { availableProductCategory } from "../constants/productCategory.constants.js";
import { populate } from "dotenv";


const showCart = async (req, res) => {

    // Category or search based cart
    const { search, category } = req.query;


    if (category && !availableProductCategory.includes(category)) {
        throw new ApiError(400, "Invalid or not found Category!")
    }

    // Find user Cart
    const cart = await Cart.findOne({ userId: req.user._id })
        .populate("items.productId")

    if (!cart) {
        throw new ApiError(404, "Cart not found!")
    }

    let items = cart.items;

    if (!items.length) {
        throw new ApiError(404, "Cart is empty!")
    }

    // Filter by category
    if (category) {
        items = items.filter(
            item => item.productId.category === category
        )
    }

    // Filter by category
    if (search) {
        items = items.filter(
            item => item.productId.name
                .toLowerCase()
                .includes(search.toLowerCase())
        );
    }


    // Formatted Cart Data
    const finalCartItems = items.map(item => ({

        productId: item.productId._id,
        productImg: item.productId.images,
        productName: item.productId.name,
        description: item.productId.description,
        price: item.productId.price,
        quantity: item.quantity,
        isActive: item.productId.isActive,
        stock: item.productId.stock

    }));


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { finalCartItems },
                "Cart fetched succesfully!"
            )
        )

}

const addItemToCart = async (req, res) => {

    // User Id
    let userId = req.user._id;

    // Recieving Data
    const { productId, quantity = 1 } = req.body;
    const qty = Number(quantity);


    if (!productId || !qty || qty < 1) {
        throw new ApiError(400, "Invalid product or quantity!");
    }

    // Finding Product in the product model
    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product does not exists!")
    }

    // Avoid Seller to purchase their own product
    if (userId.toString() === product.addedBy.toString()) {
        throw new ApiError(400, "You cannot add your own product to the cart!")
    }

    // Finding User Cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
        cart = await Cart.create({
            userId,
            items: [{ productId, quantity: qty }],
        })
    } else {

        // Check for items already exisit
        const existingItemInCart = cart.items.find(
            item => item.productId.toString() === productId
        );

        if (existingItemInCart) {
            existingItemInCart.quantity += qty
        } else {
            cart.items.push({ productId, quantity: qty })
        }

        await cart.save();
    }

    // Response back to Server
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { cart },
                "Product added to Cart!"
            )
        )
}

const decreaseCartItem = async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params;

    if (!productId) {
        throw new ApiError(400, "Product Id is required!");
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        throw new ApiError(404, "Cart not found!");
    }

    const cartItem = cart.items.find(
        item => item.productId.toString() === productId
    );

    if (!cartItem) {
        throw new ApiError(404, "Product is not in cart!");
    }

    if (cartItem.quantity > 1) {
        cartItem.quantity -= 1;
    } else {
        cart.items = cart.items.filter(
            item => item.productId.toString() !== productId
        );
    }

    await cart.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { cart },
                "Cart quantity updated successfully!"
            )
        );
};

const updateItemFromCart = async (req, res) => {

    const { productId } = req.params;
    const { quantity } = req.body;
    const qty = Number(quantity);
    
    if (isNaN(qty) || qty < 1) {
        throw new ApiError(400, "Invalid product or quantity!");
    }

    // Finding the user Cart
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
        throw new ApiError(404, "Cart not Found!")
    }

    // Find item in cart
    const item = cart.items.find(
        item => item.productId.toString() === productId
    )

    if (!item) {
        throw new ApiError(404, "Product invalid or not found!");
    }

    // Update Quantity count
    item.quantity += qty

    await cart.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { item },
                "Cart updated Successfully!"
            )
        )
}

const deleteItemFromCart = async (req, res) => {

    const { productId } = req.params;

    if (!productId) {
        throw new ApiError(400, "Failed to find or delete the Product!")
    }

    // Find user Cart
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
        throw new ApiError(404, "Cart not Found!");
    }

    //Check if item exists FIRST
    const item = cart.items.find(
        item => item.productId.toString() === productId
    )

    if (!item) {
        throw new ApiError(404, "Product Invalid or not found!")
    }

    cart.items = cart.items.filter(
        item => item.productId.toString() !== productId
    );

    await cart.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { cart },
                "Product removed from cart!"
            )
        )
}

const clearCart = async (req, res) => {

    const cart = await Cart.findOneAndUpdate({
        userId: req.user._id
    },
        { $set: { items: [] } },
        { returnDocument: "after" },

    )

    if (!cart) {
        throw new ApiError(404, "Cart not Found!")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { cart },
                "Cart cleared successfully!"
            )
        )

}


export {
    addItemToCart,
    updateItemFromCart,
    deleteItemFromCart,
    clearCart,
    showCart,
    decreaseCartItem
}


