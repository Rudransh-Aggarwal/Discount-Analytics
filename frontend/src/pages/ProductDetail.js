import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { getProduct, simulateDiscount } from "../utils/api";
import { toast } from "react-toastify";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const chartOpts = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: "#16161f", borderColor: "#2a2a3e", borderWidth: 1, titleColor: "#e2e8f0", bodyColor: "#94a3b8" },
  },
  scales: {
    y: { grid: { color: "#1e1e2e" }, ticks: { color: "#475569" }, border: { display: false } },
    x: { grid: { display: false }, ticks: { color: "#475569" }, border: { display: false } },
  },
};

const DISCOUNTS = [0, 5, 10, 15, 20, 25, 30];

export default function ProductDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const [product, setProduct] = useState(state?.product || null);
  const [simulations, setSimulations] = useState([]);
  const [bestDiscount, setBestDiscount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simLoading, setSimLoading] = useState(false);

  // Fetch product if not passed via state
  useEffect(() => {
    if (!product) {
      getProduct(id).then((r) => setProduct(r.data)).catch(() => toast.error("Failed to load product"));
    }
  }, [id]);

  // Run all simulations once product is ready
  useEffect(() => {
    if (!product) return;
    runAllSimulations(product);
  }, [product]);

  const runAllSimulations = async (p) => {
    setSimLoading(true);
    try {
      const results = await Promise.all(
        DISCOUNTS.map((d) =>
          simulateDiscount(p.id, p.price, p.category, d)
            .then((r) => ({ discount: d, units: r.data.predicted_sales, revenue: r.data.predicted_revenue }))
            .catch(() => ({ discount: d, units: null, revenue: null }))
        )
      );
      setSimulations(results);
      const best = results.reduce((a, b) => (b.revenue > (a.revenue || 0) ? b : a), results[0]);
      setBestDiscount(best);
    } catch (e) {
      toast.error("ML service unavailable — start the Python service");
    } finally {
      setSimLoading(false);
      setLoading(false);
    }
  };

  if (loading && !product) return <div className="spinner" />;
  if (!product) return <div className="error-box">Product not found.</div>;

  const validSims = simulations.filter((s) => s.revenue !== null);

  const revenueChart = {
    labels: validSims.map((s) => `${s.discount}%`),
    datasets: [{
      label: "Projected Revenue ($)",
      data: validSims.map((s) => s.revenue),
      backgroundColor: validSims.map((s) =>
        s.discount === bestDiscount?.discount ? "#f59e0b30" : "#6366f112"
      ),
      borderColor: validSims.map((s) =>
        s.discount === bestDiscount?.discount ? "#f59e0b" : "#6366f1"
      ),
      borderWidth: 2, borderRadius: 8,
    }],
  };

  const unitsChart = {
    labels: validSims.map((s) => `${s.discount}%`),
    datasets: [{
      label: "Predicted Units",
      data: validSims.map((s) => s.units),
      backgroundColor: "#6366f115",
      borderColor: "#6366f1",
      borderWidth: 2, borderRadius: 8,
    }],
  };

  const originalPrice = Math.round(product.price / (1 - (product.discountPercentage || 0) / 100));

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <Link to="/products" style={{ color: "#f59e0b", fontSize: 14, fontWeight: 500 }}>← Products</Link>
        <span style={{ color: "#1e1e2e" }}>/</span>
        <span style={{ fontSize: 14, color: "#475569", textTransform: "capitalize" }}>{product.category}</span>
        <span style={{ color: "#1e1e2e" }}>/</span>
        <span style={{ fontSize: 14, color: "#64748b" }}>{product.title}</span>
      </div>

      {/* Product Header */}
      <div className="grid-responsive-280-1fr" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, marginBottom: 28 }}>
        <div style={{
          borderRadius: 12, overflow: "hidden", border: "1px solid #1e1e2e",
          background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: 220,
        }}>
          <img src={product.thumbnail} alt={product.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 12, color: "#475569", textTransform: "capitalize", marginBottom: 8 }}>
            {product.brand && <span style={{ color: "#6366f1", fontWeight: 600 }}>{product.brand} · </span>}
            {product.category}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", fontFamily: "'Syne', sans-serif", marginBottom: 14, lineHeight: 1.2 }}>
            {product.title}
          </h1>
          <p style={{ fontSize: 14, color: "#475569", fontWeight: 300, lineHeight: 1.7, marginBottom: 16, maxWidth: 480 }}>
            {product.description}
          </p>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontFamily: "'Syne', sans-serif" }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: "#f59e0b" }}>${product.price}</span>
              {product.discountPercentage > 0 && (
                <span style={{ fontSize: 16, color: "#374151", textDecoration: "line-through", marginLeft: 10 }}>
                  ${originalPrice}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {product.discountPercentage > 0 && (
                <span className="badge badge-success">-{Math.round(product.discountPercentage)}% current</span>
              )}
              <span className="badge badge-primary">⭐ {product.rating}</span>
              <span style={{ fontSize: 12, color: "#374151" }}>{product.stock} in stock</span>
            </div>
          </div>
        </div>
      </div>

      {/* ML Advisory Banner */}
      {simLoading ? (
        <div style={{ textAlign: "center", padding: 32, color: "#475569", border: "1px solid #1e1e2e", borderRadius: 12, marginBottom: 24 }}>
          <div className="spinner" style={{ margin: "0 auto 12px" }} />
          Running ML simulations across {DISCOUNTS.length} discount levels...
        </div>
      ) : bestDiscount && (
        <div style={{
          background: "linear-gradient(135deg, #1a1200, #2a1d00)",
          border: "1px solid #f59e0b25", borderRadius: 14,
          padding: "22px 28px", marginBottom: 28,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 20, boxShadow: "0 0 40px #f59e0b08",
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              ✦ ML Recommendation
            </div>
            <div style={{ fontSize: 38, fontWeight: 900, color: "#f59e0b", fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
              {bestDiscount.discount}% Discount
            </div>
            <div style={{ fontSize: 13, color: "#92400e", marginTop: 6 }}>
              Maximises revenue · current discount is {Math.round(product.discountPercentage || 0)}%
            </div>
          </div>
          <div style={{ display: "flex", gap: 32 }}>
            {[
              { label: "Expected Units", value: Math.round(bestDiscount.units) },
              { label: "Expected Revenue", value: "$" + Math.round(bestDiscount.revenue).toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} style={{ borderLeft: "2px solid #f59e0b30", paddingLeft: 20 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fbbf24", fontFamily: "'Syne', sans-serif" }}>{value}</div>
                <div style={{ fontSize: 12, color: "#92400e", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      {validSims.length > 0 && (
        <div className="grid-responsive-1-1" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginBottom: 20 }}>
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>Revenue Simulation</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 18, fontFamily: "'Syne', sans-serif" }}>Projected by discount level</div>
            <Bar data={revenueChart} options={chartOpts} />
            <p style={{ fontSize: 12, color: "#d97706", fontWeight: 600, marginTop: 10 }}>▲ Amber bar = recommended</p>
          </div>

          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>Units Sold Simulation</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 18, fontFamily: "'Syne', sans-serif" }}>Predicted units by discount</div>
            <Bar data={unitsChart} options={chartOpts} />
          </div>
        </div>
      )}

      {/* Simulation Table */}
      {validSims.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 18 }}>All Simulations</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
                {["Discount", "Effective Price", "Predicted Units", "Projected Revenue", "Status"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: "#374151", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {validSims.map((s) => {
                const isRec = s.discount === bestDiscount?.discount;
                const effectivePrice = (product.price * (1 - s.discount / 100)).toFixed(2);
                return (
                  <tr key={s.discount} style={{ borderBottom: "1px solid #16161f", background: isRec ? "#f59e0b06" : "transparent" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: isRec ? "#f59e0b" : "#e2e8f0", fontFamily: "'Syne', sans-serif" }}>{s.discount}%</td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8" }}>${effectivePrice}</td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{Math.round(s.units)}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#e2e8f0", fontFamily: "'Syne', sans-serif" }}>${Math.round(s.revenue).toLocaleString()}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {isRec
                        ? <span className="badge badge-warning">✓ Recommended</span>
                        : <span style={{ fontSize: 12, color: "#374151" }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
