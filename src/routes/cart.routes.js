import { Router } from "express"
import { verify } from "jsonwebtoken"
import { verifyJwt } from "../middlewares/auth.middleware.js"
import { addItemToCart, clearCart, deleteItemFromCart, showCart, updateItemFromCart } from "../controllers/cart.controllers.js"
import { cartUpdateValidator } from "../validators/validateData.validators.js"
import { validateErrors } from "../middlewares/validator.middleware.js"

const router = Router()
router.use(verifyJwt)

router.route("/")
    .get(showCart)
    .post(addItemToCart)
    .delete(clearCart)

router.route("/:productId")
    .put(cartUpdateValidator(), validateErrors, updateItemFromCart)
    .delete(deleteItemFromCart)

export default router