const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Product = require("./models/Product");
const Sale = require("./models/Sale");

// Simple CSV parser (no extra deps needed)
function parseCSV(filepath) {
  const content = fs.readFileSync(filepath, "utf8");
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const vals = line.split(",");
    const obj = {};
    headers.forEach((h, i) => (obj[h.trim()] = vals[i]?.trim()));
    return obj;
  });
}

async function seed() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/discount_advisory";
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const datasetDir = path.join(__dirname, "../dataset");
  const productsPath = path.join(datasetDir, "products.csv");
  const salesPath = path.join(datasetDir, "sales_data.csv");

  // Seed Products
  const rawProducts = parseCSV(productsPath);
  const products = rawProducts.map((p) => ({
    product_id: p.product_id,
    name: p.name,
    category: p.category,
    price: Number(p.price),
  }));

  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`✓ Seeded ${products.length} products`);

  // Seed Sales
  const rawSales = parseCSV(salesPath);
  const sales = rawSales.map((s) => ({
    product_id: s.product_id,
    date: new Date(s.date),
    price: Number(s.price),
    discount: Number(s.discount),
    units_sold: Number(s.units_sold),
  }));

  await Sale.deleteMany({});
  const batchSize = 500;
  for (let i = 0; i < sales.length; i += batchSize) {
    await Sale.insertMany(sales.slice(i, i + batchSize));
    process.stdout.write(`\r  Inserting sales: ${Math.min(i + batchSize, sales.length)}/${sales.length}`);
  }
  console.log(`\n✓ Seeded ${sales.length} sales records`);

  await mongoose.disconnect();
  console.log("\n✅ Database seeded successfully!");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
