import express from "express"
import dbConnect from "./db/dbConnection.js";
import dotenv from "dotenv"

dotenv.config();
const PORT = process.env.PORT;


const app = express();


dbConnect()
    .then(() => {

        app.listen(PORT, (req, res) => {
            console.log(`Server runing on http://localhost:${PORT}`);
        })
    })
    .catch((err) => {
        console.error("Something went wrong while connecting to the Database!", err);
    })


