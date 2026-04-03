import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config();

const dbConnect = async () => {

    try {

        const connection = await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connecting to Database was success! ✅");

    } catch (error) {
        console.error("Failed connecting to the Database! ❌", error);
        process.exit(1);
    }

}


export default dbConnect