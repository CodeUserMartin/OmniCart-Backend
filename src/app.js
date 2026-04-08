import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();


// Server Config
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());


// Cors config
app.use(cors(
    {
        origin: process.env.CROSS_ORIGION,
        credentials: true
    }
))

// Routes

import authRouter from "./routes/auth.routes.js"

app.use("/api/v1/auth", authRouter);

app.get("/", (req, res) => {
    res.send("Welcome to OmniCart!!");
})

export default app;