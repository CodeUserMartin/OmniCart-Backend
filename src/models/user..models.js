import mongoose, { Schema } from "mongoose"

const userSchema = new Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            trim: true,
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
            enum: ['user', 'seller'],
            default: "User",
        },
        phoneNumber: {
            type: String,
            match: [/^\d{10}$/, "Invalid phone number"],
        },
        address: {
            addressLine: String,
            city: String,
            state: String,
            pincode: String,
            country: String,
        },
        storeName: {
            type: String,
            required: function () {
                return this.role === 'seller';
            }
        },
        storeAddress: {
            type: String,
            required: function () {
                return this.role === 'seller';
            }
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

export const User = mongoose.model("User", userSchema); 