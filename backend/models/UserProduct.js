const mongoose = require("mongoose");

const userProductSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    brand: { type: String, default: "" },
    current_discount: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    // ML results stored after prediction
    recommended_discount: { type: Number, default: null },
    expected_units: { type: Number, default: null },
    expected_revenue: { type: Number, default: null },
    // Source tag so frontend can distinguish
    source: { type: String, default: "upload" },
  },
  { timestamps: true }
);

// Compound index: same user can't have duplicate product names
userProductSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("UserProduct", userProductSchema);
