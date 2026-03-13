import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler, RadialLinearScale
} from "chart.js";
import { Bar, Line, Doughnut, Radar } from "react-chartjs-2";
import { getProducts, getUserProducts } from "../utils/api";
import { useAuth } from "../utils/AuthContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler, RadialLinearScale);

const COLORS = {
  smartphones: "#6366f1", laptops: "#f59e0b", fragrances: "#ec4899",
  skincare: "#10b981", groceries: "#3b82f6", "home-decoration": "#8b5cf6",
  furniture: "#f43f5e", tops: "#06b6d4", "womens-dresses": "#a855f7",
  "womens-shoes": "#f97316", "mens-shirts": "#84cc16", "mens-shoes": "#eab308",
  "mens-watches": "#64748b", "womens-watches": "#e879f9", "womens-bags": "#fb7185",
  "womens-jewellery": "#fbbf24", sunglasses: "#2dd4bf", automotive: "#f87171",
  motorcycle: "#a78bfa", lighting: "#34d399",
  electronics: "#6366f1", clothing: "#ec4899", footwear: "#f97316",
  books: "#3b82f6", sports: "#10b981", home: "#8b5cf6", beauty: "#e879f9",
};

const getColor = (cat) => COLORS[cat?.toLowerCase()] || "#6366f1";
const tooltipDefaults = { backgroundColor: "#16161f", borderColor: "#2a2a3e", borderWidth: 1, titleColor: "#e2e8f0", bodyColor: "#94a3b8", padding: 10 };
const axisDefaults = {
  y: { grid: { color: "#1e1e2e" }, ticks: { color: "#475569" }, border: { display: false } },
  x: { grid: { display: false }, ticks: { color: "#475569", maxRotation: 30 }, border: { display: false } },
};

function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div className="card" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -24, right: -24, width: 90, height: 90, borderRadius: "50%", background: color + "10", pointerEvents: "none" }} />
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif" }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 900, color, fontFamily: "'Syne', sans-serif", lineHeight: 1.1, margin: "6px 0 4px" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#374151" }}>{sub}</div>}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [dummyProducts, setDummyProducts] = useState([]);
  const [userProducts, setUserProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProducts(100).then((r) => r.data.products || []),
      getUserProducts().then((r) => r.data.data || []).catch(() => []),
    ]).then(([dummy, uploaded]) => {
      setDummyProducts(dummy);
      setUserProducts(uploaded);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  // Normalise both sources to common shape
  const allProducts = [
    ...dummyProducts.map((p) => ({ name: p.title, price: p.price, category: p.category?.toLowerCase(), discount: p.discountPercentage || 0, rating: p.rating || 0, stock: p.stock || 0, thumbnail: p.thumbnail, source: "catalog" })),
    ...userProducts.map((p) => ({ name: p.name, price: p.price, category: p.category?.toLowerCase(), discount: p.current_discount || 0, rating: null, stock: p.stock || 0, thumbnail: null, source: "upload", recommended_discount: p.recommended_discount, expected_revenue: p.expected_revenue })),
  ];

  const hasUploads = userProducts.length > 0;
  const userWithML = userProducts.filter((p) => p.recommended_discount != null);

  // Category map — all products combined
  const catMap = {};
  allProducts.forEach((p) => {
    const c = p.category;
    if (!catMap[c]) catMap[c] = { count: 0, totalPrice: 0, totalDiscount: 0, totalRating: 0, ratingCount: 0 };
    catMap[c].count++;
    catMap[c].totalPrice += p.price;
    catMap[c].totalDiscount += p.discount;
    if (p.rating) { catMap[c].totalRating += p.rating; catMap[c].ratingCount++; }
  });

  const categories = Object.keys(catMap).sort((a, b) => catMap[b].count - catMap[a].count).slice(0, 12);
  const totalProducts = allProducts.length;
  const avgPrice = Math.round(allProducts.reduce((s, p) => s + p.price, 0) / totalProducts);
  const avgDiscount = (allProducts.reduce((s, p) => s + p.discount, 0) / totalProducts).toFixed(1);
  const rated = allProducts.filter((p) => p.rating);
  const avgRating = rated.length ? (rated.reduce((s, p) => s + p.rating, 0) / rated.length).toFixed(1) : "N/A";

  const buckets = { "<$20": 0, "$20–100": 0, "$100–500": 0, "$500–1K": 0, ">$1K": 0 };
  allProducts.forEach((p) => {
    if (p.price < 20) buckets["<$20"]++;
    else if (p.price < 100) buckets["$20–100"]++;
    else if (p.price < 500) buckets["$100–500"]++;
    else if (p.price < 1000) buckets["$500–1K"]++;
    else buckets[">$1K"]++;
  });

  const mostExpensive = [...dummyProducts].sort((a, b) => b.price - a.price)[0];
  const mostDiscounted = [...dummyProducts].sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

  const baseOpts = { responsive: true, plugins: { legend: { display: false }, tooltip: tooltipDefaults }, scales: axisDefaults };

  const catBarData = { labels: categories, datasets: [{ label: "Products", data: categories.map((c) => catMap[c].count), backgroundColor: categories.map((c) => getColor(c) + "30"), borderColor: categories.map((c) => getColor(c)), borderWidth: 2, borderRadius: 8 }] };
  const avgPriceBarData = { labels: categories, datasets: [{ label: "Avg Price ($)", data: categories.map((c) => Math.round(catMap[c].totalPrice / catMap[c].count)), backgroundColor: "#f59e0b18", borderColor: "#f59e0b", borderWidth: 2, borderRadius: 8 }] };
  const discountBarData = { labels: categories, datasets: [{ label: "Avg Discount (%)", data: categories.map((c) => parseFloat((catMap[c].totalDiscount / catMap[c].count).toFixed(1))), backgroundColor: "#10b98118", borderColor: "#10b981", borderWidth: 2, borderRadius: 8 }] };
  const doughnutData = { labels: categories, datasets: [{ data: categories.map((c) => catMap[c].count), backgroundColor: categories.map((c) => getColor(c) + "cc"), borderColor: "#111118", borderWidth: 3, hoverOffset: 8 }] };

  const ratingCats = categories.filter((c) => catMap[c].ratingCount > 0);
  const ratingLineData = { labels: ratingCats, datasets: [{ label: "Avg Rating", data: ratingCats.map((c) => parseFloat((catMap[c].totalRating / catMap[c].ratingCount).toFixed(2))), borderColor: "#ec4899", backgroundColor: "#ec489910", fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: "#ec4899", pointBorderColor: "#111118", pointBorderWidth: 2 }] };
  const priceDistData = { labels: Object.keys(buckets), datasets: [{ label: "Products", data: Object.values(buckets), backgroundColor: ["#10b98130", "#6366f130", "#f59e0b30", "#ec489930", "#3b82f630"], borderColor: ["#10b981", "#6366f1", "#f59e0b", "#ec4899", "#3b82f6"], borderWidth: 2, borderRadius: 6 }] };

  const radarCats = ratingCats.slice(0, 7);
  const radarData = { labels: radarCats, datasets: [{ label: "Avg Rating × 20", data: radarCats.map((c) => parseFloat((catMap[c].totalRating / catMap[c].ratingCount * 20).toFixed(1))), backgroundColor: "#f59e0b12", borderColor: "#f59e0b", borderWidth: 2, pointBackgroundColor: "#f59e0b", pointRadius: 4 }, { label: "Avg Discount", data: radarCats.map((c) => parseFloat((catMap[c].totalDiscount / catMap[c].count).toFixed(1))), backgroundColor: "#6366f112", borderColor: "#6366f1", borderWidth: 2, pointBackgroundColor: "#6366f1", pointRadius: 4 }] };

  // User portfolio charts
  const userRevenueChart = { labels: userWithML.map((p) => p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name), datasets: [{ label: "Expected Revenue", data: userWithML.map((p) => Math.round(p.expected_revenue || 0)), backgroundColor: userWithML.map((p) => p.recommended_discount > p.current_discount ? "#10b98130" : "#f59e0b30"), borderColor: userWithML.map((p) => p.recommended_discount > p.current_discount ? "#10b981" : "#f59e0b"), borderWidth: 2, borderRadius: 6 }] };
  const userDiscountChart = { labels: userWithML.map((p) => p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name), datasets: [{ label: "Current %", data: userWithML.map((p) => p.current_discount), backgroundColor: "#6366f130", borderColor: "#6366f1", borderWidth: 2, borderRadius: 6 }, { label: "Recommended %", data: userWithML.map((p) => p.recommended_discount || 0), backgroundColor: "#f59e0b30", borderColor: "#f59e0b", borderWidth: 2, borderRadius: 6 }] };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            ● Live · {hasUploads ? `Catalog + Your ${userProducts.length} Products` : "DummyJSON Catalog"}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", fontFamily: "'Syne', sans-serif" }}>
            {greeting}, <span style={{ color: "#f59e0b" }}>{user?.name?.split(" ")[0]}</span>
          </h1>
          <p style={{ color: "#475569", marginTop: 4, fontSize: 14, fontWeight: 300 }}>
            {totalProducts} products across {categories.length} categories
            {hasUploads && <span style={{ color: "#10b981" }}> — including {userProducts.length} from your uploads</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/upload" className="btn btn-outline" style={{ fontSize: 14 }}>↑ Upload CSV</Link>
          <Link to="/products" className="btn btn-primary">Browse Catalog →</Link>
        </div>
      </div>

      {/* Global KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <KpiCard label="Total Products" value={totalProducts} icon="📦" color="#f59e0b" sub={`${dummyProducts.length} catalog + ${userProducts.length} uploaded`} />
        <KpiCard label="Avg. Price" value={`$${avgPrice}`} icon="💰" color="#10b981" sub="across all sources" />
        <KpiCard label="Avg. Discount" value={`${avgDiscount}%`} icon="🏷️" color="#6366f1" sub="current listed discount" />
        <KpiCard label="Avg. Rating" value={avgRating} icon="⭐" color="#ec4899" sub="catalog products only" />
      </div>

      {/* Row 1 */}
      <div className="grid-responsive-3-2" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>Avg Rating by Category</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 20, fontFamily: "'Syne', sans-serif" }}>Customer satisfaction trends</div>
          <Line data={ratingLineData} options={{ ...baseOpts, plugins: { ...baseOpts.plugins, legend: { display: false } }, scales: { ...axisDefaults, y: { ...axisDefaults.y, min: 3, max: 5 } } }} />
        </div>
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>Category Mix</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>All sources combined</div>
          <Doughnut data={doughnutData} options={{ responsive: true, cutout: "65%", plugins: { legend: { position: "bottom", labels: { color: "#475569", font: { family: "'DM Sans'", size: 10 }, boxWidth: 8, padding: 10 } }, tooltip: tooltipDefaults } }} />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid-responsive-1-1-1" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>Products per Category</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 18, fontFamily: "'Syne', sans-serif" }}>Count distribution</div>
          <Bar data={catBarData} options={baseOpts} />
        </div>
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>Avg Price by Category</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 18, fontFamily: "'Syne', sans-serif" }}>Price landscape</div>
          <Bar data={avgPriceBarData} options={baseOpts} />
        </div>
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>Avg Discount by Category</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 18, fontFamily: "'Syne', sans-serif" }}>Discount depth</div>
          <Bar data={discountBarData} options={baseOpts} />
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid-responsive-1-1-1" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>Price Distribution</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 18, fontFamily: "'Syne', sans-serif" }}>All products by price band</div>
          <Bar data={priceDistData} options={baseOpts} />
        </div>
        {radarCats.length > 0 && (
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>Rating vs Discount</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 10, fontFamily: "'Syne', sans-serif" }}>Category radar</div>
            <Radar data={radarData} options={{ responsive: true, plugins: { legend: { labels: { color: "#64748b", font: { family: "'DM Sans'" }, boxWidth: 10 } }, tooltip: tooltipDefaults }, scales: { r: { grid: { color: "#1e1e2e" }, ticks: { color: "#374151", backdropColor: "transparent", font: { size: 10 } }, pointLabels: { color: "#64748b", font: { family: "'DM Sans'", size: 11 } } } } }} />
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ flex: 1, background: "linear-gradient(135deg,#1a1200,#2a1d00)", border: "1px solid #f59e0b20" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>✦ Most Expensive</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <img src={mostExpensive?.thumbnail} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", lineHeight: 1.3 }}>{mostExpensive?.title}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#f59e0b", fontFamily: "'Syne', sans-serif" }}>${mostExpensive?.price}</div>
              </div>
            </div>
            <Link to={`/product/${mostExpensive?.id}`} style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>View Advisory →</Link>
          </div>
          <div className="card" style={{ flex: 1, background: "linear-gradient(135deg,#001a10,#00291a)", border: "1px solid #10b98120" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>✦ Most Discounted</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <img src={mostDiscounted?.thumbnail} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#34d399", lineHeight: 1.3 }}>{mostDiscounted?.title}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#10b981", fontFamily: "'Syne', sans-serif" }}>-{Math.round(mostDiscounted?.discountPercentage)}%</div>
              </div>
            </div>
            <Link to={`/product/${mostDiscounted?.id}`} style={{ fontSize: 12, color: "#10b981", fontWeight: 700 }}>View Advisory →</Link>
          </div>
        </div>
      </div>

      {/* ── Your Uploaded Products ── only shown if user has uploads */}
      {hasUploads && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>● Your Uploads</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Syne', sans-serif" }}>Your Portfolio — ML Advisory</div>
            </div>
            <Link to="/upload" className="btn btn-outline" style={{ fontSize: 13 }}>Manage Products →</Link>
          </div>

          {/* User KPIs */}
          <div className="grid-responsive-1-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
            {[
              { label: "Uploaded Products", value: userProducts.length, color: "#f59e0b" },
              { label: "With ML Advisory", value: userWithML.length, color: "#10b981" },
              { label: "Total Exp. Revenue", value: userWithML.length > 0 ? "$" + Math.round(userWithML.reduce((s, p) => s + (p.expected_revenue || 0), 0)).toLocaleString() : "—", color: "#6366f1" },
              { label: "Need Discount Change", value: userWithML.filter((p) => p.recommended_discount !== p.current_discount).length, color: "#ec4899" },
            ].map(({ label, value, color }) => (
              <div className="card" key={label} style={{ position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: color + "10" }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif" }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: "'Syne', sans-serif", marginTop: 6 }}>{value}</div>
              </div>
            ))}
          </div>

          {userWithML.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
              <div className="card">
                <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>Expected Revenue per Product</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 18, fontFamily: "'Syne', sans-serif" }}>
                  <span style={{ color: "#10b981" }}>Green</span> = increase · <span style={{ color: "#f59e0b" }}>Amber</span> = reduce / maintain
                </div>
                <Bar data={userRevenueChart} options={baseOpts} />
              </div>
              <div className="card">
                <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>Current vs Recommended %</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 18, fontFamily: "'Syne', sans-serif" }}>Discount comparison</div>
                <Bar data={userDiscountChart} options={{ ...baseOpts, plugins: { ...baseOpts.plugins, legend: { display: true, position: "top", labels: { color: "#94a3b8", font: { family: "'DM Sans'" }, boxWidth: 10 } } } }} />
              </div>
            </div>
          )}

          {/* Compact table */}
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 14 }}>Your Products at a Glance</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
                    {["Product", "Category", "Price", "Current %", "Recommended %", "Exp. Revenue", "Change"].map((h) => (
                      <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 11, color: "#374151", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userProducts.slice(0, 8).map((p) => {
                    const up = p.recommended_discount > p.current_discount;
                    const down = p.recommended_discount < p.current_discount;
                    return (
                      <tr key={p._id} style={{ borderBottom: "1px solid #16161f" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#16161f"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "11px 12px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{p.name}</div>
                          {p.brand && <div style={{ fontSize: 11, color: "#374151" }}>{p.brand}</div>}
                        </td>
                        <td style={{ padding: "11px 12px", fontSize: 12, color: "#64748b", textTransform: "capitalize" }}>{p.category}</td>
                        <td style={{ padding: "11px 12px", fontWeight: 700, color: "#e2e8f0", fontFamily: "'Syne', sans-serif" }}>${p.price.toLocaleString()}</td>
                        <td style={{ padding: "11px 12px" }}><span className="badge" style={{ background: "#6366f120", color: "#818cf8" }}>{p.current_discount}%</span></td>
                        <td style={{ padding: "11px 12px" }}>
                          {p.recommended_discount != null
                            ? <span className="badge badge-warning">{p.recommended_discount}%</span>
                            : <span style={{ fontSize: 12, color: "#374151" }}>—</span>}
                        </td>
                        <td style={{ padding: "11px 12px", fontWeight: 700, color: "#e2e8f0", fontFamily: "'Syne', sans-serif" }}>
                          {p.expected_revenue != null ? "$" + Math.round(p.expected_revenue).toLocaleString() : "—"}
                        </td>
                        <td style={{ padding: "11px 12px" }}>
                          {p.recommended_discount == null ? <span style={{ fontSize: 12, color: "#374151" }}>—</span>
                            : up ? <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>▲ +{p.recommended_discount - p.current_discount}%</span>
                            : down ? <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444" }}>▼ {p.recommended_discount - p.current_discount}%</span>
                            : <span style={{ fontSize: 12, color: "#374151" }}>✓ optimal</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {userProducts.length > 8 && (
                <div style={{ padding: "12px 12px 4px", fontSize: 13, color: "#475569" }}>
                  Showing 8 of {userProducts.length} — <Link to="/upload" style={{ color: "#f59e0b", fontWeight: 600 }}>view all →</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 14 }}>Quick Actions</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { to: "/products", label: "Browse Catalog", icon: "📦", color: "#f59e0b" },
            { to: "/simulator", label: "Discount Simulator", icon: "⚡", color: "#6366f1" },
            { to: "/upload", label: hasUploads ? "Manage Uploads" : "Upload Your Data", icon: "📂", color: "#10b981" },
          ].map(({ to, label, icon, color }) => (
            <Link key={to} to={to} style={{ flex: 1, minWidth: 160, display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 10, border: "1px solid #1e1e2e", background: "#0a0a0f", transition: "all 0.2s", color: "#e2e8f0" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = color + "50"; e.currentTarget.style.background = color + "08"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e1e2e"; e.currentTarget.style.background = "#0a0a0f"; }}
            >
              <span style={{ fontSize: 22 }}>{icon}</span>
              <span style={{ fontWeight: 600, fontSize: 15, fontFamily: "'Syne', sans-serif" }}>{label}</span>
              <span style={{ marginLeft: "auto", color: "#374151" }}>→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
