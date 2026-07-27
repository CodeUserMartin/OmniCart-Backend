import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.utils.js";

export const validateErrors = (req, res, next) => {

    const errors = validationResult(req)

    if (errors.isEmpty()) {
        return next();
    }

    const extractedErrors = [];

    errors.array().map((err) => extractedErrors.push({
        [err.path]: err.msg
    })
    );
    // console.log("Error Array:", extractedErrors);

    throw new ApiError(400, "Validation Failed!", extractedErrors);

}


