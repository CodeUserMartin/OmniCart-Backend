import { Router } from "express"
import { currentLoginUser, forgetPasswordRequest, loginUser, becomeSeller, logoutUser, refreshAccessToken, registerUser, resetForgetPassword, userVerificationEmail, reSentUserVerificationEmail, userChangeCurrentPassword } from "../controllers/auth.controllers.js";
import { validateErrors } from "../middlewares/validator.middleware.js";
import { userRegistrationValidation, userLoginValidation, userforgetPasswordValidator, userResetForgetPasswordValidator, userChangePasswordValidation } from "../validators/validateData.validators.js";
import { verifyJwt } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(userRegistrationValidation(), validateErrors, registerUser);
router.route("/login").post(userLoginValidation(), validateErrors, loginUser);
router.route("/become-seller").post(verifyJwt, upload.single("addressProof"), becomeSeller);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/verify-email/:emailVerificationToken").get(userVerificationEmail);
router.route("/forget-password").post(userforgetPasswordValidator(), validateErrors, forgetPasswordRequest);
router.route("/reset-password/:resetToken").post(userResetForgetPasswordValidator(), validateErrors, resetForgetPassword);

//Secure Routes
router.route("/current-user").get(verifyJwt, currentLoginUser);
router.route("/change-password").post(verifyJwt, userChangePasswordValidation(), validateErrors, userChangeCurrentPassword)
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/resent-email-verification").post(verifyJwt, reSentUserVerificationEmail)



export default router;