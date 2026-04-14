import { v2 as cloudinary } from "cloudinary"
import dotenv from "dotenv/config"
import fs from "fs";

dotenv.config();

//Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

const cloudinaryUploader = async (localFilePath) => {

    try {

        if (!localFilePath) return null;

        // Upload file on Cloudinary
        const result = await cloudinary.uploader.upload(
            localFilePath, {
            resource_type: "auto"
        })

        console.log("File Uploaded Successfully!", result.url);

        //  Remove file from the server when uploaded success to cloudinary
        fs.unlinkSync(localFilePath);
        return result;

    } catch (error) {

        // remove local file if upload fails
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        console.error("File upload action failed!!", error);
        return null;

    }
}

export { cloudinaryUploader }