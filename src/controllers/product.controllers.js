import { availableProductCategory } from "../constants/productCategory.constants.js";
import { Product } from "../models/product.models.js";
import { ApiError } from "../utils/ApiError.utils.js"
import { ApiResponse } from "../utils/ApiResponse.utils.js"
import { cloudinaryUploader } from "../utils/cloudinary.utils.js"


const addProduct = async (req, res) => {

    try {
        const { name, desc, price, stock, category } = req.body;

        // console.log(req.body);


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
        const { name, desc, stock } = req.body;

        const updateFields = {};

        // Name update
        if (name) updateFields.name = name;

        // Description update
        if (desc) updateFields.description = desc;

        // Stock update
        if (stock !== undefined) {
            const stk = Number(stock);

            if (isNaN(stk) || stk < 0) {
                throw new ApiError(400, "Invalid stock value");
            }

            updateFields.stock = stk; // ✅ FIXED TYPO
        }

        // Prevent empty update
        if (Object.keys(updateFields).length === 0) {
            throw new ApiError(400, "No fields provided for update");
        }

        // Update product
        const product = await Product.findOneAndUpdate(
            {
                _id: productId,
                addedBy: req.user?._id,
            },
            { $set: updateFields },
            { new: true }
        );

        if (!product) {
            throw new ApiError(404, "Product not found or unauthorized!");
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                { product },
                "Product updated successfully!"
            )
        );

    } catch (error) {
        console.error("Update Product Error:", error);

        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to update product"
        );
    }
};

const removeProduct = async (req, res) => {

    const { productId } = req.params;

    const product = await Product.findOneAndUpdate(
        {
            _id: productId,
            addedBy: req.user?._id,
        },
        {
            $set: { isActive: false }
        },
        { returnDocument: 'after' }
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

// Show all Products (with Filter)
const getProducts = async (req, res) => {

    const { search, category } = req.query;

    if (category && !availableProductCategory.includes(category)) {
        throw new ApiError(401, "Product Category not found!");
    }

    let filter = { isActive: true };

    if (category) {
        filter.category = category;
    }

    if (search) {
        filter.name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(filter);


    if (products.length === 0) {
        throw new ApiError(404, "No Product found!");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                { products },
                "Product fetched Successfully!"
            )
        )

}

const getProductById = async (req, res) => {

    const { productId } = req.params;

    // console.log("Product ID:", productId);

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(401, "Product not found!");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { product },
                "Product Fetched Successfully!"
            )
        )
}

// Seller's Product
const getMyProducts = async (req, res) => {

    const products = await Product.find({
        addedBy: req.user._id,
        isActive: true
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { products },
            "Products fetched successfully!"
        )
    );
};

export {
    addProduct,
    updateProduct,
    removeProduct,
    getProducts,
    getProductById,
    getMyProducts
}

