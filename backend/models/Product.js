const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    product_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["Electronics", "Clothing", "Footwear", "Books", "Sports", "Home", "Beauty"],
    },
    price: { type: Number, required: true },
    current_discount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
