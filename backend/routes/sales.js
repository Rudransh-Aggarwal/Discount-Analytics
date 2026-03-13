const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");

// GET sales for a product
router.get("/:product_id", async (req, res) => {
  try {
    const sales = await Sale.find({ product_id: req.params.product_id }).sort({ date: -1 }).limit(100);
    res.json({ success: true, data: sales, count: sales.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET aggregated sales stats for a product
router.get("/:product_id/stats", async (req, res) => {
  try {
    const stats = await Sale.aggregate([
      { $match: { product_id: req.params.product_id } },
      {
        $group: {
          _id: "$discount",
          avg_units: { $avg: "$units_sold" },
          total_units: { $sum: "$units_sold" },
          records: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthly = await Sale.aggregate([
      { $match: { product_id: req.params.product_id } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          total_units: { $sum: "$units_sold" },
          avg_discount: { $avg: "$discount" },
          total_revenue: {
            $sum: { $multiply: ["$units_sold", { $multiply: ["$price", { $subtract: [1, { $divide: ["$discount", 100] }] }] }] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, discount_stats: stats, monthly_stats: monthly });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST seed sales
router.post("/seed", async (req, res) => {
  try {
    const { sales } = req.body;
    await Sale.deleteMany({});
    const inserted = await Sale.insertMany(sales);
    res.json({ success: true, message: `Seeded ${inserted.length} sales records` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
