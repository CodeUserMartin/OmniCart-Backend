import { Product } from "../models/product.models.js"
import { Cart } from "../models/cart.models.js"
import { ApiError } from "../utils/ApiError.utils.js";
import { User } from "../models/user..models.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";


const showCart = async (req, res) => {

}

const addItemToCart = async (req, res) => {

    // User Id
    let userId = req.user._id;

    // Recieving Data
    const { productId, quantity } = req.body;
    const qty = Number(quantity);


    if (!productId || !qty || qty < 1) {
        throw new ApiError(400, "Invalid product or quantity!");
    }

    // Finding Product in the product model
    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product does not exists!")
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

const updateItemFromCart = async (req, res) => {

}

const deleteItemFromCart = async (req, res) => {

}

const clearCart = async (req, res) => {

}



export {
    addItemToCart,
    updateItemFromCart,
    deleteItemFromCart,
    clearCart,
    showCart
}


