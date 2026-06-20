import { Router } from "express";

import { getNotifications, markNotificationRead, markAllNotificationsRead }
    from "../controllers/notification.controllers.js";

import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJwt);

router.route("/")
    .get(getNotifications);

router.route("/read/:notificationId")
    .put(markNotificationRead);

router.route("/read-all")
    .put(markAllNotificationsRead);

export default router;