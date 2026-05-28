import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getOrders, checkoutCart, buyProduct, updateOrderStatus, cancelOrder } from "../controllers/order.controllers.js";

const router = Router();

router.use(verifyJwt);

router.route("/")
    .get(getOrders)

router.route("/checkout")
    .post(checkoutCart)

router.route("/buy-now/:productId")
    .post(buyProduct)

router.route("/cancel/:orderId")
    .put(cancelOrder)

router.route("/:orderId/status")
    .put(updateOrderStatus)




export default router;