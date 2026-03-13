require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");

const productRoutes = require("./routes/products");
const salesRoutes = require("./routes/sales");
const discountRoutes = require("./routes/discount");
const { router: authRoutes } = require("./routes/auth");
const userProductRoutes = require("./routes/userProducts");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/user-products", userProductRoutes);
app.use("/api", discountRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/discount_advisory";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
      console.log(`ML service URL: ${process.env.ML_SERVICE_URL || "http://localhost:5002"}`);
      console.log(`CORS origin (frontend): ${process.env.CORS_ORIGIN || "http://localhost:3000"}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

module.exports = app;
