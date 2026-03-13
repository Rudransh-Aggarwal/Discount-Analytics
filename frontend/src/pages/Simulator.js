import React, { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { getProducts, simulateDiscount } from "../utils/api";
import { toast } from "react-toastify";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: "top", labels: { color: "#94a3b8", font: { family: "'DM Sans'" } } },
    tooltip: { backgroundColor: "#16161f", borderColor: "#2a2a3e", borderWidth: 1, titleColor: "#e2e8f0", bodyColor: "#94a3b8" },
  },
  scales: {
    y: { grid: { color: "#1e1e2e" }, ticks: { color: "#475569" }, border: { display: false } },
    x: { grid: { display: false }, ticks: { color: "#475569" }, border: { display: false } },
  },
};

export default function Simulator() {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [discount, setDiscount] = useState(10);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Fetch from DummyJSON ──────────────────────────────────────
  useEffect(() => {
    getProducts(100).then((r) => setProducts(r.data.products || []));
  }, []);

  const product = products.find((p) => String(p.id) === selectedId);

  const handleSimulate = async () => {
    if (!selectedId) return toast.error("Please select a product");
    if (!product) return toast.error("Product not found");
    setLoading(true);
    try {
      // Pass price + category — backend no longer does a MongoDB lookup
      const res = await simulateDiscount(product.id, product.price, product.category, discount);
      const data = res.data;
      setResult(data);
      setHistory((prev) => [
        { ...data, name: product.title, timestamp: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ]);
    } catch (e) {
      toast.error(e.response?.data?.error || "Simulation failed — is the ML service running?");
    } finally {
      setLoading(false);
    }
  };

  const chartData = history.length > 0 ? {
    labels: [...history].reverse().map((h) => `${h.discount}%`),
    datasets: [
      { label: "Revenue ($)", data: [...history].reverse().map((h) => h.predicted_revenue), backgroundColor: "#f59e0b18", borderColor: "#f59e0b", borderWidth: 2, borderRadius: 6 },
      { label: "Units × 100", data: [...history].reverse().map((h) => h.predicted_sales * 100), backgroundColor: "#6366f112", borderColor: "#6366f1", borderWidth: 2, borderRadius: 6 },
    ],
  } : null;

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    background: "#0a0a0f", border: "1px solid #1e1e2e",
    borderRadius: 9, fontSize: 14, color: "#e2e8f0",
    fontFamily: "'DM Sans', sans-serif", outline: "none",
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>● Predictive Tool</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", fontFamily: "'Syne', sans-serif" }}>Discount Simulator</h1>
        <p style={{ color: "#475569", marginTop: 4, fontSize: 14, fontWeight: 300 }}>Predict sales and revenue for any discount level in real time</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24, alignItems: "start" }}>
        {/* Control Panel */}
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 20, fontFamily: "'Syne', sans-serif" }}>Configure</div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 7, letterSpacing: "0.06em", textTransform: "uppercase" }}>Select Product</label>
            <select
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); setResult(null); }}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">-- Choose a product --</option>
              {products.map((p) => (
                <option key={p.id} value={String(p.id)} style={{ background: "#111118" }}>
                  {p.title} (${p.price})
                </option>
              ))}
            </select>
          </div>

          {/* Product preview */}
          {product && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", background: "#0a0a0f", borderRadius: 8, padding: "10px 12px", marginBottom: 16, border: "1px solid #1e1e2e" }}>
              <img src={product.thumbnail} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.3 }}>{product.title}</div>
                <div style={{ fontSize: 11, color: "#475569", textTransform: "capitalize", marginTop: 2 }}>
                  {product.category} · ${product.price}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 7, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Discount — <span style={{ color: "#f59e0b" }}>{discount}%</span>
            </label>
            <input
              type="range" min={0} max={50} step={1} value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#f59e0b" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#374151", marginTop: 4 }}>
              <span>0%</span><span>25%</span><span>50%</span>
            </div>
          </div>

          {/* Quick presets */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Presets</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[5, 10, 15, 20, 25, 30].map((d) => (
                <button key={d} onClick={() => setDiscount(d)} style={{
                  padding: "5px 12px", borderRadius: 6, border: "1px solid",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  borderColor: discount === d ? "#f59e0b" : "#1e1e2e",
                  background: discount === d ? "#f59e0b12" : "#0a0a0f",
                  color: discount === d ? "#f59e0b" : "#475569",
                  fontFamily: "'DM Sans', sans-serif",
                }}>{d}%</button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading || !selectedId}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", opacity: loading || !selectedId ? 0.5 : 1 }}
          >
            {loading ? "Predicting..." : "▶ Run Simulation"}
          </button>
        </div>

        {/* Results */}
        <div>
          {result ? (
            <div>
              <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                {[
                  { label: "Discount Applied", value: result.discount + "%", color: "#f59e0b" },
                  { label: "Predicted Units", value: Math.round(result.predicted_sales), color: "#6366f1" },
                  { label: "Predicted Revenue", value: "$" + Math.round(result.predicted_revenue).toLocaleString(), color: "#10b981" },
                ].map(({ label, value, color }) => (
                  <div className="card" key={label} style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>{label}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: "'Syne', sans-serif" }}>{value}</div>
                  </div>
                ))}
              </div>

              {chartData && (
                <div className="card" style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>Simulation History</div>
                  <Bar data={chartData} options={chartOptions} />
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: "64px 40px" }}>
              <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.3 }}>◎</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#e2e8f0", marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>Ready to Simulate</div>
              <div style={{ color: "#374151", fontSize: 14 }}>Select a product and discount level, then run the simulation.</div>
            </div>
          )}

          {history.length > 0 && (
            <div className="card">
              <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>Recent Simulations</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
                    {["Time", "Product", "Discount", "Units", "Revenue"].map((h) => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "#374151", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #16161f" }}>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#374151" }}>{h.timestamp}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 500, color: "#94a3b8", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</td>
                      <td style={{ padding: "10px 12px" }}><span className="badge badge-warning">{h.discount}%</span></td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#94a3b8" }}>{Math.round(h.predicted_sales)}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#e2e8f0", fontFamily: "'Syne', sans-serif" }}>${Math.round(h.predicted_revenue).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}