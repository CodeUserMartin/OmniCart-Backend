import { Notification } from "../models/notification.models.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import { ApiError } from "../utils/ApiError.utils.js";

const getNotifications = async (req, res) => {

    const userId = req.user._id;

    const notifications = await Notification
        .find({ userId })
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(
            200,
            { notifications },
            "Notifications fetched successfully!"
        )
    );
};

const markNotificationRead = async (req, res) => {

    const userId = req.user._id;
    const { notificationId } = req.params;

    const notification =
        await Notification.findOneAndUpdate(
            {
                _id: notificationId,
                userId
            },
            {
                isRead: true
            },
            {
                new: true
            }
        );

    if (!notification) {
        throw new ApiError(
            404,
            "Notification not found!"
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            { notification },
            "Notification marked as read!"
        )
    );
};

const markAllNotificationsRead = async (
    req,
    res
) => {

    const userId = req.user._id;

    await Notification.updateMany(
        {
            userId,
            isRead: false
        },
        {
            $set: {
                isRead: true
            }
        }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "All notifications marked as read!"
        )
    );
};

export {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead
};