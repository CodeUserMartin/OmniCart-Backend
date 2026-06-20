import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";

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

import authRoutes from "./routes/auth.routes.js"
import productRoutes from "./routes/product.routes.js"
import cartRoutes from "./routes/cart.routes.js"
import orderRoutes from "./routes/order.routes.js"
import notificationRoutes from "./routes/notification.routes.js"

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/notification", notificationRoutes);

app.use(errorHandler);

app.get("/", (req, res) => {
    res.send("Welcome to OmniCart!!");
})

export default app;