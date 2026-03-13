const express = require("express");
const router = express.Router();
const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

// GET /api/discount-advice-direct?productId=1&price=549&category=smartphones
router.get("/discount-advice-direct", async (req, res) => {
  try {
    const { productId, price, category } = req.query;
    if (!price || !category)
      return res.status(400).json({ success: false, error: "price and category are required" });

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/advise`, {
      product_id: String(productId),
      price: Number(price),
      category: mapCategory(category),
    });

    res.json({ success: true, ...mlResponse.data });
  } catch (err) {
    if (err.code === "ECONNREFUSED")
      return res.status(503).json({ success: false, error: "ML service unavailable" });
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/simulate-discount
router.post("/simulate-discount", async (req, res) => {
  try {
    const { product_id, price, category, discount } = req.body;
    if (!price || !category || discount === undefined)
      return res.status(400).json({ success: false, error: "price, category and discount are required" });

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
      product_id: String(product_id),
      price: Number(price),
      discount: Number(discount),
      category: mapCategory(category),
    });

    res.json({
      success: true,
      product_id,
      discount: Number(discount),
      predicted_sales: mlResponse.data.predicted_units_sold,
      predicted_revenue: mlResponse.data.predicted_revenue,
    });
  } catch (err) {
    if (err.code === "ECONNREFUSED")
      return res.status(503).json({ success: false, error: "ML service unavailable" });
    res.status(500).json({ success: false, error: err.message });
  }
});

function mapCategory(cat) {
  const c = (cat || "").toLowerCase();
  if (c.includes("phone") || c.includes("laptop") || c.includes("computer") || c.includes("electronic") || c.includes("tablet")) return "Electronics";
  if (c.includes("shirt") || c.includes("dress") || c.includes("top") || c.includes("cloth") || c.includes("jacket") || c.includes("men") || c.includes("women")) return "Clothing";
  if (c.includes("shoe") || c.includes("boot") || c.includes("sandal") || c.includes("sneaker")) return "Footwear";
  if (c.includes("book") || c.includes("fiction") || c.includes("history")) return "Books";
  if (c.includes("sport") || c.includes("gym") || c.includes("fitness") || c.includes("outdoor") || c.includes("cycling")) return "Sports";
  if (c.includes("home") || c.includes("furniture") || c.includes("decor") || c.includes("kitchen") || c.includes("garden") || c.includes("light")) return "Home";
  if (c.includes("beauty") || c.includes("skin") || c.includes("fragrance") || c.includes("hair") || c.includes("cosmetic")) return "Beauty";
  return "Electronics";
}

module.exports = router;
