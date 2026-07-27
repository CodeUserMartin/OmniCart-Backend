import mongoose, { Schema } from "mongoose"
import { availableUserRoles, userRolesEnum } from "../constants/userRoles.constants.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { ContextHandlerImpl } from "express-validator/lib/chain/context-handler-impl.js"

const userSchema = new Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        email: {
            type: String,
            unique: true,
            trim: true,
            index: true,
            lowercase: true,
            required: [true, "Email is Required"],
        },
        password: {
            type: String,
            trim: true,
            required: [true, "Password is Required"],
        },
        role: {
            type: String,
            enum: availableUserRoles,
            default: userRolesEnum.USER,
        },
        addresses: [
            {
                addressLine: {
                    type: String,
                    required: true,
                    trim: true,
                },

                city: {
                    type: String,
                    required: true,
                    trim: true
                },

                state: {
                    type: String,
                    required: true,
                    trim: true
                },

                pincode: {
                    type: String,
                    required: true,
                    match: [/^\d{6}$/, "Pincode must be exactly 6 digits"]
                },

                country: {
                    type: String,
                    required: true,
                    trim: true
                },

                phone: {
                    type: String,
                    required: true,
                    match: [
                        /^\d{10}$/,
                        "Phone number must be exactly 10 digits"
                    ]
                }
            }
        ],
        sellerInfo: {
            type: {
                storeName: {
                    type: String,
                    trim: true,
                    required: true,
                },
                storeAddress: {
                    addressLine: String,
                    contactNumber: String,
                    city: String,
                    state: String,
                    pincode: String,
                    country: String,
                    addressProof: String,
                },
            },
            default: undefined
        },
        refreshToken: {
            type: String,
        },
        emailVerificationToken: {
            type: String,
        },
        emailVerificationExpiry: {
            type: Date,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        forgetPasswordToken: {
            type: String
        },
        forgetPasswordExpiry: {
            type: Date,
        }
    },
    { timestamps: true }
)

//Pre Hook to encrypt the password
userSchema.pre("save", async function () {

    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
})


//Compare password for login user
userSchema.methods.isPasswordCorrect = async function (password) {

    return await bcrypt.compare(password, this.password);
}

// ------------- Generate Tokens -----------------

// Access Token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            lastName: this.lastName,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    )
}

// Refresh Token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )
}


// Temporary Tokken
userSchema.methods.generateTemporaryToken = function () {

    const unHashedToken = crypto.randomBytes(20).toString("hex")

    const hashedToken = crypto
        .createHash("sha256")
        .update(unHashedToken)
        .digest("hex")

    const tokenExpiry = Date.now() + (20 * 60 * 1000) // 20 Mins
    return { unHashedToken, hashedToken, tokenExpiry }
}



export const User = mongoose.model("User", userSchema); 