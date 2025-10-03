"use strict";
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
const { Server } = require("socket.io");

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(
  cors({
    //origin: process.env.CORS_ORIGIN || "*",
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Connect to MongoDB
const mongoOptions = {
  dbName: process.env.DB_NAME || "fanboxes_dev",
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 50,
  minPoolSize: 5,
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,
  waitQueueTimeoutMS: 10000,
};

const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    console.log("✅ Connected to MongoDB");

    mongoose.connection.on("connected", () => {
      console.log("Mongoose connected to DB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("Mongoose disconnected from DB");
    });
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    console.log("Retrying connection in 5 seconds...");
    setTimeout(connectWithRetry, 5000);
  }
};

// Initialize connection
connectWithRetry();

// Routes

// var cron = require('node-cron');

// cron.schedule('* * * * *', () => {
//   console.log('running a task every minute');
// });

const homeRoutes = require("./routes/home");
const roleRoutes = require("./routes/role");
const creditRoutes = require("./routes/credit");
const authRoutes = require("./routes/auth");
const brandRoutes = require("./routes/brand");
const categoryRoutes = require("./routes/category");
const subcategoryRoutes = require("./routes/subcategory");
const newsletterRoutes = require("./routes/newsletter");
const productRoutes = require("./routes/product");
const dashboardRoutes = require("./routes/dashboard");
const searchRoutes = require("./routes/search");
const userRoutes = require("./routes/user");
const cartRoutes = require("./routes/cart");
const spinRoutes = require("./routes/spin");
const couponCodeRoutes = require("./routes/coupon-code");
const productReviewRoutes = require("./routes/product-review");
const reviewRoutes = require("./routes/review");
const wishlistRoutes = require("./routes/wishlist");
const OrderRoutes = require("./routes/order");
const paymentRoutes = require("./routes/payment-intents");
const delete_fileRoutes = require("./routes/file-delete");
const shopRoutes = require("./routes/shop");
const payment = require("./routes/payment");
const currency = require("./routes/currencies");
const compaign = require("./routes/compaign");
const slideRoute = require("./routes/slide");
const adminTransactionRoutes = require("./routes/adminTransactionRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const privacyPolicyRoutes = require("./routes/privacyPolicy");

app.use("/api", homeRoutes);
app.use("/api", roleRoutes);
app.use("/api", creditRoutes);
app.use("/api", authRoutes);
app.use("/api", brandRoutes);
app.use("/api", categoryRoutes);
app.use("/api", subcategoryRoutes);
app.use("/api", newsletterRoutes);
app.use("/api", productRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", searchRoutes);
app.use("/api", userRoutes);
app.use("/api", cartRoutes);
app.use("/api", spinRoutes);
app.use("/api", couponCodeRoutes);
app.use("/api", productReviewRoutes);
app.use("/api", reviewRoutes);
app.use("/api", wishlistRoutes);
app.use("/api", OrderRoutes);
app.use("/api", paymentRoutes);
app.use("/api", delete_fileRoutes);
app.use("/api", shopRoutes);
app.use("/api", payment);
app.use("/api", currency);
app.use("/api", compaign);
app.use("/api", slideRoute);
app.use("/api", adminTransactionRoutes);
app.use("/api", transactionRoutes);
app.use("/api", privacyPolicyRoutes);

// GET API
app.get("/", (req, res) => {
  res.send("This is a GET API");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
