import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getOrders, checkoutCart, buyProduct, updateOrderStatus, cancelOrder, getSellerPendingOrders, acceptOrder, getSellerConfirmOrders, shipOrder, deliverOrder, getSellerShippedOrders, getSellerDeliveredOrders, getSellerCancelledOrders, getSellerDashboard } from "../controllers/order.controllers.js";

const router = Router();

router.use(verifyJwt);

router.route("/")
    .get(getOrders)

router.route("/checkout")
    .post(checkoutCart)

router.route("/buy-now/:productId")
    .post(buyProduct)

router.route("/seller/pending")
    .get(getSellerPendingOrders)

router.route("/seller/accept/:itemId")
    .put(acceptOrder);

router.route("/seller/confirmed")
    .get(getSellerConfirmOrders);

router.route("/seller/ship/:itemId")
    .put(shipOrder);

router.route("/seller/shipped")
    .get(getSellerShippedOrders);

router.route("/seller/deliver/:itemId")
    .put(deliverOrder);

router.route("/seller/delivered")
    .get(getSellerDeliveredOrders);

// TODO: Refactor for item-level order status
router.route("/:orderId/status")
    .put(updateOrderStatus)

router.route("/cancel/:itemId")
    .put(cancelOrder);

router.route("/seller/cancelled")
    .get(getSellerCancelledOrders);

router.route("/seller/dashboard")
    .get(getSellerDashboard);



export default router;