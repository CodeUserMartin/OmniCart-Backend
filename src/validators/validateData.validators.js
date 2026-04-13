import { body } from "express-validator"


const userRegistrationValidation = () => {
    return [
        body("email")
            .trim()
            .normalizeEmail()
            .notEmpty()
            .withMessage("Email is Required!")
            .isEmail()
            .withMessage("Invalid Email Format"),

        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password is Required!")
            .isLength({ min: 6 })
            .withMessage("Password must be at least 6 characters long"),

        body("firstName")
            .trim()
            .notEmpty()
            .withMessage("First Name is Required!"),

        body("lastName")
            .trim()
            .notEmpty()
            .withMessage("Last Name is Required!"),

        body("phoneNumber")
            .trim()
            .notEmpty()
            .withMessage("Phone Number is Required!")
            .isMobilePhone("en-IN")
            .withMessage("Invalid Number")
    ]
}

const userLoginValidation = () => {
    return [

        body("email")
            .trim()
            .normalizeEmail()
            .isEmail()
            .withMessage("Invalid Email Format")
            .notEmpty()
            .withMessage("Email is Required1"),

        body("password")
            .trim()
            .notEmpty("Password is Required!")

    ]
}

const userChangePasswordValidation = () => {
    return [

        body("oldPassword")
            .notEmpty()
            .withMessage("Old password is required!"),

        body("newPassword")
            .notEmpty()
            .withMessage("New Password is Required!"),
    ]
}


const userforgetPasswordValidator = () => {
    return [
        body("email")
            .notEmpty()
            .withMessage("Email is Required!")
            .trim()
            .isEmail()
            .withMessage("Invaid Email!"),
    ]
}

const userResetForgetPasswordValidator = () => {
    return [

        body("newPassword")
            .notEmpty()
            .withMessage("New Password is Required!"),
    ]
}

export {
    userRegistrationValidation,
    userLoginValidation,
    userChangePasswordValidation,
    userforgetPasswordValidator,
    userResetForgetPasswordValidator,

}