import mongoose, { Schema } from "mongoose"
import { availableProductCategory } from "../constants/productCategory.constants.js"

const productSchema = new Schema(
    {
        images: [
            {
                type: String,
                required: [true, "Product Image is Required!"],
            }
        ],
        name: {
            type: String,
            required: [true, "Product Name is Required!"]
        },
        description: {
            type: String,
            required: [true, "Product Description is Required!"],
        },
        price: {
            type: Number,
            required: [true, "Product Price is Required!"]
        },
        stock: {
            type: Number,
        },
        averageRating: {
            type: Number,
            default: 0,
        },
        numReviews: {
            type: Number,
            default: 0,
        },
        review: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
                    ref: "User"
                },
                rating: Number,
                comment: String,
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        category: {
            type: String,
            enum: availableProductCategory,
            required: [true, "Product Category is Required!"],
        },
        addedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    },
)


export const Product = new mongoose.model("Product", productSchema); 