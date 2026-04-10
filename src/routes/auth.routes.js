import { Router } from "express"
import { loginUser, registerUser } from "../controllers/auth.controllers.js";
import { validateErrors } from "../middlewares/validator.middleware.js";
import { userRegistrationValidation, userLoginValidation } from "../validators/validateData.validators.js";

const router = Router();

router.route("/register").post(userRegistrationValidation(), validateErrors, registerUser);
router.route("/login").post(userLoginValidation(), validateErrors, loginUser);


export default router;