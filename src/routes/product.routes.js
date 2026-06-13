import { Router } from "express"
import { verifyJwt } from "../middlewares/auth.middleware.js"
import { addProduct, getProducts, updateProduct, removeProduct, getProductById, getMyProducts } from "../controllers/product.controllers.js";
import { productInsertValidator, productUpdateValidator } from "../validators/validateData.validators.js";
import { validateErrors } from "../middlewares/validator.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";


const router = Router();

router.route("/")
    .get(getProducts)
    .post(verifyJwt, upload.array("images", 5), addProduct)

    router.route("/my-products")
    .get(verifyJwt, getMyProducts)

router.route("/:productId")
    .get(getProductById)
    .put(verifyJwt, productUpdateValidator(), validateErrors, updateProduct)
    .delete(verifyJwt, removeProduct)


export default router