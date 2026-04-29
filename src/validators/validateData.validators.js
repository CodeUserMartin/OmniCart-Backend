import { body } from "express-validator"


// Auth Validators
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


// Product Validators
const productInsertValidator = () => {
    return [

        body("name")
            .notEmpty()
            .withMessage("Product name is required!"),

        body("desc")
            .notEmpty()
            .withMessage("Product Description cannot be empty!"),

        body("price")
            .notEmpty()
            .withMessage("Product Price cannot be empty!")
            .isFloat({ gt: 0, max: 10000 })
            .withMessage("Price cannot exceed 10000"),

        body("stock")
            .notEmpty()
            .withMessage("Product stock cannot be empty!")
            .isInt({ gt: 0, max: 5000 })
            .withMessage("Stock max capacity is 1000"),

        body("category")
            .notEmpty()
            .withMessage("Product category cannot be empty!"),

    ]
}

const productUpdateValidator = () => {
    return [

        body("name")
            .notEmpty()
            .withMessage("Product name is required"),

        body("desc")
            .notEmpty()
            .withMessage("Product description is required"),

        body("stock")
            .notEmpty()
            .withMessage("Product Quantity is requried")
            .isInt({ gt: 0, max: 5000 })
            .withMessage("Stock max capacity is 5000"),

    ]
}


// Cart Validators
const cartUpdateValidator = () => {
    return [

        body("quantity")
            .notEmpty()
            .withMessage("Quantity is required!")
            .isInt({ gt: 1 })
    ]
}

export {
    userRegistrationValidation,
    userLoginValidation,
    userChangePasswordValidation,
    userforgetPasswordValidator,
    userResetForgetPasswordValidator,
    productInsertValidator,
    productUpdateValidator,
    cartUpdateValidator

}