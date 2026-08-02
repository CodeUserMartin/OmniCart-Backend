import { ApiError } from "../utils/ApiError.utils.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js"

export const verifyJwt = async (req, res, next) => {

    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorize Request!, Access Denied");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        );

        if (!user) {
            throw new ApiError(401, "Invalid Token")
        }

        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(500, "Failed to Verify User!");
    }
}