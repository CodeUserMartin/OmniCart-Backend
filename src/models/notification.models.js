import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        referenceId: {
            type: Schema.Types.ObjectId,
        },

    }, { timestamps: true })

export const Notification = mongoose.model("Notification", notificationSchema)