const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    product_id: { type: String, required: true, ref: "Product" },
    date: { type: Date, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, required: true },
    units_sold: { type: Number, required: true },
  },
  { timestamps: true }
);

saleSchema.index({ product_id: 1, date: -1 });

module.exports = mongoose.model("Sale", saleSchema);
