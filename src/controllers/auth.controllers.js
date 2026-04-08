import { ApiResponse } from "../utils/ApiResponse.utils.js"
import { ApiError } from "../utils/ApiError.utils.js"
import { User } from "../models/user..models.js"
import { emailVerificationMailService, sendEmail } from "../utils/MailService.utils.js"

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
        - send back AccessToken via cookies to the user browser
        - send response back to the client
    */

    try {

        const { firstName, lastName, email, password, phoneNumber, role } = req.body;

        // Check for already existing user
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log("user found :", existingUser);
            
            throw new ApiError(401, "Email already Registered!")
        }

        // Create User document
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            isEmailVerified: false
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
                `${req.protocal}://${req.get("host")}/${process.env.VERIFY_EMAIL_URL}/${unHashedToken}`
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
                    200,
                    { user: createdUser },
                    "User Register Successfully, kindly verify your email to continue"
                )
            );
    } catch (error) {
        console.error(error);
        throw new ApiError(500, "Registration Failed!");
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

        const user = User.findOne({ email });

        // User exist check
        if (!user) {
            throw new ApiError("User is not registered, Please first do registration!")
        }

        // Password check
        const isPasswordMatching = user.isPasswordCorrect(password);

        if (!isPasswordMatching) {
            throw new ApiError("402", "Password is incorrent!")
        }

        // access and refresh Token
        const { accessToken, refreshToken } = generateAccessTokenNRefreshToken(user._id);

        const loggedInUser = user.findById(user._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        )

        // secure cookies
        const options = {
            httpOnly: true,
            secure: true
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
                        accessToken,
                        refreshToken
                    },
                    "User Logged in Success!"
                )
            )

    } catch (error) {
        console.error(error);
        throw new ApiError(500, "Login Failed")
    }
}


export { registerUser, loginUser }