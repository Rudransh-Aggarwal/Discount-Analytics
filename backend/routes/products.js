const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Sale = require("../models/Sale");

// GET all products with latest sales stats
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });

    // Get latest discount for each product
    const enriched = await Promise.all(
      products.map(async (p) => {
        const latestSale = await Sale.findOne({ product_id: p.product_id }).sort({ date: -1 });
        return {
          ...p.toObject(),
          current_discount: latestSale ? latestSale.discount : 0,
        };
      })
    );

    res.json({ success: true, data: enriched, count: enriched.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ product_id: req.params.id });
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create product
router.post("/", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST seed from CSV data (utility endpoint)
router.post("/seed", async (req, res) => {
  try {
    const { products } = req.body;
    await Product.deleteMany({});
    const inserted = await Product.insertMany(products);
    res.json({ success: true, message: `Seeded ${inserted.length} products` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
