import multer from "multer"
import path from "path"

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, "public/images")
    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 1e9)

        const ext = path.extname(file.originalname)
        cb(null, uniqueName + ext)
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG, JPEG, PNG files are allowed"), false)
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
    }
})