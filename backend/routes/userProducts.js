const express = require("express");
const router = express.Router();
const UserProduct = require("../models/UserProduct");
const { authMiddleware } = require("./auth");

// All routes require auth
router.use(authMiddleware);

// GET /api/user-products — get all products for the logged-in user
router.get("/", async (req, res) => {
  try {
    const products = await UserProduct.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: products, count: products.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/user-products/bulk — save array of products from CSV upload
// Upserts by userId + name so re-uploading the same product updates it
router.post("/bulk", async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0)
      return res.status(400).json({ success: false, error: "products array is required" });

    const ops = products.map((p) => ({
      updateOne: {
        filter: { userId: req.userId, name: p.name },
        update: {
          $set: {
            userId: req.userId,
            name: p.name,
            price: p.price,
            category: p.category,
            brand: p.brand || "",
            current_discount: p.current_discount || 0,
            stock: p.stock || 0,
            recommended_discount: p.recommended_discount ?? null,
            expected_units: p.expected_units ?? null,
            expected_revenue: p.expected_revenue ?? null,
            source: "upload",
          },
        },
        upsert: true,
      },
    }));

    const result = await UserProduct.bulkWrite(ops);
    const saved = await UserProduct.find({ userId: req.userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
      data: saved,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/user-products/:id — update ML results for a single product
router.patch("/:id", async (req, res) => {
  try {
    const product = await UserProduct.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: req.body },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/user-products/:id — delete one product
router.delete("/:id", async (req, res) => {
  try {
    const product = await UserProduct.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/user-products — delete ALL products for the user
router.delete("/", async (req, res) => {
  try {
    const result = await UserProduct.deleteMany({ userId: req.userId });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
