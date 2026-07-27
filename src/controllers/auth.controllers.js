import { ApiResponse } from "../utils/ApiResponse.utils.js"
import { ApiError } from "../utils/ApiError.utils.js"
import { User } from "../models/user..models.js"
import { emailVerificationMailService, forgotPasswordEmailService, sendEmail } from "../utils/MailService.utils.js"
import crypto from "crypto"
import { userRolesEnum } from "../constants/userRoles.constants.js"

import { cloudinaryUploader } from "../utils/cloudinary.utils.js"

const generateAccessTokenNRefreshToken = async (userId) => {

    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went Wrong while generating Tokens");
    }

}

const registerUser = async (req, res) => {

    /* Steps
      1) Recieving Data
      2) Processing Data
        - check fields empty
        - validate data
        - check if user already exists
        - create user and add db entry
        - generate AccessToken and Temporary tokens
        - send verification mail to the user
        - send response back to the client
    */

    try {

        const { firstName, lastName, email, password } = req.body;

        // Check for already existing user
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            throw new ApiError(401, "Email already Registered!")
        }

        let role = userRolesEnum.USER;

        // Create User document
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            role,
            isEmailVerified: false,
        })

        // Generating Verificaion Tokens
        const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpiry = tokenExpiry;

        await user.save({ validateBeforeSave: false });

        // Send Email
        await sendEmail({
            email: user?.email,
            subject: "Verify your Email",
            mailgenContent: emailVerificationMailService(
                user.firstName,
                user.lastName,
                `${process.env.FRONTEND_URL}/verify-email/${unHashedToken}`
            )
        })

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        )

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while Registration, Please Try again Later!")
        }

        // Send Back response to the Client
        return res
            .json(
                new ApiResponse(
                    201,
                    { user: createdUser },
                    "User Register Successfully, kindly verify your email to continue"
                )
            );
    } catch (error) {
        console.error(error);
        // throw new ApiError(500, "Registration Failed!");
        throw error;
    }
}

const loginUser = async (req, res) => {

    /*
        Steps
         1) Recieving Data
         2) Processing Data
            - check empty fields
            - validate data
            - check if user exisit
            - password check
            - grand user login
            - send refreshToken and accessToken via cookies
            - send back response to the client
    */

    try {

        // Recieving Data
        const { email, password } = req.body;

        if (!email) {
            throw new ApiError(500, "Email is Required");
        }

        const user = await User.findOne({ email });

        // User exist check
        if (!user) {
            throw new ApiError(404, "User does not exists!")
        }

        // Password check
        const isPasswordMatching = await user.isPasswordCorrect(password);

        if (!isPasswordMatching) {
            throw new ApiError(401, "Email or Password is incorrect!")
        }

        // access and refresh Token
        const { accessToken, refreshToken } = await generateAccessTokenNRefreshToken(user._id);

        const loggedInUser = await User.findById(user._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        )

        // secure cookies
        const options = {
            httpOnly: true,
            secure: true,
        }

        // send response back to client
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser,
                    },
                    "User Logged in Success!"
                )
            )

    } catch (error) {
        console.error(error);
        // throw new ApiError(500, "Login Failed")
        throw error;
    }
}


const becomeSeller = async (req, res) => {

    const userId = req.user._id;

    const {
        storeName,
        contactNumber,
        addressLine,
        city,
        state,
        country,
        pinCode,
    } = req.body;

    
    // Validate Required Fields
    if (
        !storeName ||
        !contactNumber ||
        !addressLine ||
        !city ||
        !state ||
        !country ||
        !pinCode
    ) {
        throw new ApiError(
            400,
            "All seller details are required!"
        );
    }

    // Validate Address Proof Upload
    const addressProofLocalPath = req.file?.path;


    if (!addressProofLocalPath) {
        throw new ApiError(
            400,
            "Address proof is required!"
        );
    }


    // Upload Address Proof
    const uploadedAddressProof =
        await cloudinaryUploader(
            addressProofLocalPath
        );


    if (!uploadedAddressProof) {
        throw new ApiError(
            500,
            "Failed to upload address proof!"
        );
    }

    // Find User
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(
            404,
            "User not found!"
        );
    }

    // Check if already seller
    if (
        user.role === userRolesEnum.SELLER
    ) {
        throw new ApiError(
            400,
            "User is already a seller!"
        );
    }

    // Update Seller Information
    user.role = userRolesEnum.SELLER;

    user.sellerInfo = {
        storeName,

        storeAddress: {
            addressLine,
            contactNumber,
            city,
            state,
            country,
            pinCode,
            addressProof:
                uploadedAddressProof.secure_url,
        },
    };


    await user.save();


    const responseUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    )


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user: responseUser },
                "Seller registration successful!"
            )
        );
};

const getUserAddresses = async (req, res) => {
    const user = await User.findById(req.user._id);

    return res.status(200).json(
        new ApiResponse(200, user.addresses, "Addresses fetched successfully")
    );
};


const logoutUser = async (req, res) => {
    try {

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refreshToken: "",
                }
            },
            {
                returnDocument: 'after'
            }
        )

        if (!user) {
            throw new ApiError(401, "Permission Denied!");
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, "Logged out Successfully!"));


    } catch (error) {
        console.error(error);
        throw new ApiError(401, "Failed to logout!");

    }
}

const userVerificationEmail = async (req, res) => {

    try {

        const { emailVerificationToken } = req.params;

        if (!emailVerificationToken) {
            throw new ApiError(400, "Verification Token is missing!");
        }

        let hashedToken = crypto
            .createHash("sha256")
            .update(emailVerificationToken)
            .digest("hex")

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpiry: { $gt: Date.now() },
        })

        if (!user) {
            throw new ApiError(400, "Invalid or mission Token!");
        }

        user.emailVerificationToken = undefined;
        user.emailVerificationExpiry = undefined;

        user.isEmailVerified = true;
        await user.save({ validateBeforeSave: false });


        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        isEmailVerified: true
                    },
                    "Email is Verified!"
                )
            )

    } catch (error) {
        throw error;
    }
}

const reSentUserVerificationEmail = async (req, res) => {

    try {

        const user = await User.findById(req.user?._id);

        if (!user) {
            throw new ApiError(404, "User does not exists!");
        }

        if (user.isEmailVerified) {
            throw new ApiError(409, "Email is already Verified!");
        }

        const { unHashedToken, hashedToken, tokenExpiry } =
            user.generateTemporaryToken();

        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpiry = tokenExpiry;

        await user.save({ validateBeforeSave: false })

        await sendEmail({
            email: user?.email,
            subject: "Please Verify your Email",
            mailgenContent: emailVerificationMailService(
                user.firstName,
                user.lastName,
                `${req.protocol}://${req.get("host")}/${process.env.VERIFY_EMAIL_URL}/${unHashedToken}`,
            )
        });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Mail is send to your Email Id"));

    } catch (error) {
        throw error;
    }

}

const refreshAccessToken = async (req, res) => {

    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request!");
    }

    try {

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid Token!!");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Token Expired!!");
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const { accessToken, refreshAccessToken: newRefreshToken }
            = await generateAccessTokenNRefreshToken(user._id)

        user.refreshToken = newRefreshToken;
        await user.save();


        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    "Token refresh Done!!"
                ),
            );

    } catch (error) {
        throw error;
    }

}

const currentLoginUser = async (req, res) => {

    try {

        const userId = req.user?._id;


        if (!userId) {
            throw new ApiError(401, "Failed to find User Details!")
        }

        const user = await User.findById(userId)
            .select(
                "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
            );

        if (!user) {
            throw new ApiError(404, "Failed to fetch user Details!");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { user },
                    "Current User Details Fetching Succefully!"
                )
            )


    } catch (error) {
        throw error;
    }

}

const userChangeCurrentPassword = async (req, res) => {

    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(401, "User not found!");
    }

    const isMatch = await user.isPasswordCorrect(oldPassword);

    if (!isMatch) {
        throw new ApiError(401, "Invaid Password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200,
                {},
                "Password changed Successfully!"
            )
        );

}

const forgetPasswordRequest = async (req, res) => {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User does not exists");
    }

    const { unHashedToken, hashedToken, tokenExpiry }
        = user.generateTemporaryToken();


    user.forgetPasswordToken = hashedToken;
    user.forgetPasswordExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        subject: "Password reset Request",
        mailgenContent: forgotPasswordEmailService(
            user.firstName,
            user.lastName,
            `${process.env.FRONTEND_URL}/reset-password/${unHashedToken}`
        )
    });


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset mail is sent to your Email!"
            )
        )
}

const resetForgetPassword = async (req, res) => {

    const { resetToken } = req.params;
    const { newPassword } = req.body;

    let hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex")

    const user = await User.findOne({
        forgetPasswordToken: hashedToken,
        forgetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
        throw new ApiError(401, "Invalid or Token is Expired!!");
    }

    user.forgetPasswordToken = undefined;
    user.forgetPasswordExpiry = undefined;

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password Reset Succesfully!!"
            )
        )
}



export {
    registerUser,
    loginUser,
    becomeSeller,
    getUserAddresses,
    logoutUser,
    currentLoginUser,
    userVerificationEmail,
    reSentUserVerificationEmail,
    refreshAccessToken,
    userChangeCurrentPassword,
    forgetPasswordRequest,
    resetForgetPassword,

}