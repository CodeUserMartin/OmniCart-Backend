import express from "express"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config();

const app = express();


// Server Config
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));


// Cors config
app.use(cors(
    {
        origin: process.env.CROSS_ORIGION,
        credentials: true
    }
))

app.get("/", (req, res) => {
    res.send("Welcome to OmniCart!!");
})

export default app;