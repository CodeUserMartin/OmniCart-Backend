import { availableProductCategory } from "../constants/productCategory.constants.js";
import { Product } from "../models/product.models.js";
import { ApiError } from "../utils/ApiError.utils.js"
import { ApiResponse } from "../utils/ApiResponse.utils.js"
import { cloudinaryUploader } from "../utils/cloudinary.utils.js"


const addProduct = async (req, res) => {

    try {

        const { name, desc, price, stock, category } = req.body;

        if (!availableProductCategory.includes(category)) {
            throw new ApiError(400, "Invalid Product Category!");
        }

        if (!req.files || req.files.length === 0) {
            throw new ApiError(400, "Product Image is Required!");
        }

        const uploadedImages = [];

        for (const file of req.files) {
            const result = await cloudinaryUploader(file.path)

            if (result) {
                uploadedImages.push(result.secure_url)
            }
        }

        const product = await Product.create({
            name,
            description: desc,
            price,
            stock,
            category,
            images: uploadedImages,
            addedBy: req.user?._id,
        });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { product },
                    "Product Added Successfully!"

                )
            )
    } catch (error) {
        console.error("Error :", error);
        throw new ApiError(401, "Failed to Add Product!")
    }
}

const updateProduct = async (req, res) => {

    try {

        const { productId } = req.params;
        const { name, desc } = req.body;

        const updateFields = {};

        if (Object.keys(updateFields).length === 0) {
            throw new ApiError(400, "No fields provided for update");
        }

        if (name) updateFields.name = name;
        if (desc) updateFields.description = desc;

        const product = await Product.findOneAndUpdate({
            _id: productId,
            addedBy: req.user?._id,
        },
            { $set: updateFields },
            { returnDocument: 'after' }
        )

        if (!product) {
            throw new ApiError(404, "Product not found or unauthorized!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { product },
                    "Product Updated Successfully!"
                )
            )
    } catch (error) {
        console.error("Error: ", error);
        throw new ApiError(400, "Failed to Update Product!");

    }


}

const removeProduct = async (req, res) => {

    const { productId } = req.params;

    const product = await Product.findOneAndDelete({
        _id: productId,
        addedBy: req.user?._id,
    }
    );

    if (!product) {
        throw new ApiError(404, "Product not found or unauthorized!");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { product },
                "Product Removed Successfully!"
            )
        );

}

const getProducts = async (req, res) => {

}

const getProductById = async (req, res) => {

}

const currentProductInfo = async (req, res) => {

}

const getProductByCategory = async (req, res) => {

}

const getCategoryProductById = async (req, res) => {

}







export {
    addProduct,
    updateProduct,
    removeProduct,
    getProducts,
    getProductById,
    currentProductInfo,
    getProductByCategory,
    getCategoryProductById
}

