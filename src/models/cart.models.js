import mongoose, { Schema } from "mongoose";

const cartSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number,
                    min: 1,
                    required: [true, "Item count cannot be 0"],
                },
            }
        ],
    },
    { timestamps: true }
)

export const Cart = mongoose.model("Cart", cartSchema);    