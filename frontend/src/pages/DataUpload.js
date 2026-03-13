import React, { useState, useRef, useCallback, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { simulateDiscount, getUserProducts, saveUserProducts, deleteUserProduct, clearUserProducts } from "../utils/api";
import { toast } from "react-toastify";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const REQUIRED_COLS = ["name", "price", "category"];
const OPTIONAL_COLS = ["brand", "current_discount", "stock"];

const SAMPLE_CSV = `name,price,category,brand,current_discount,stock
Wireless Headphones,2999,Electronics,Sony,10,50
Running Shoes,3499,Footwear,Nike,5,120
Cotton T-Shirt,799,Clothing,H&M,0,200
Python Programming Book,599,Books,OReilly,0,80
Yoga Mat,1299,Sports,Decathlon,15,60
Scented Candle,499,Home,IKEA,0,150
Face Serum,1199,Beauty,Minimalist,20,90`;

const chartOpts = {
  responsive: true,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: "#16161f", borderColor: "#2a2a3e", borderWidth: 1, titleColor: "#e2e8f0", bodyColor: "#94a3b8" } },
  scales: {
    y: { grid: { color: "#1e1e2e" }, ticks: { color: "#475569" }, border: { display: false } },
    x: { grid: { display: false }, ticks: { color: "#475569", maxRotation: 30 }, border: { display: false } },
  },
};

function parseCSV(text) {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_COLS.filter((c) => !headers.includes(c));
  if (missing.length) throw new Error(`Missing required columns: ${missing.join(", ")}`);
  return lines.slice(1).map((line, i) => {
    const vals = line.split(",").map((v) => v.trim());
    const row = {};
    headers.forEach((h, idx) => (row[h] = vals[idx] || ""));
    const price = parseFloat(row.price);
    if (isNaN(price) || price <= 0) throw new Error(`Row ${i + 2}: price must be a positive number (got "${row.price}")`);
    return {
      id: i,
      name: row.name,
      price,
      category: row.category,
      brand: row.brand || "",
      current_discount: parseFloat(row.current_discount) || 0,
      stock: parseInt(row.stock) || 0,
    };
  });
}

function downloadCSV(data) {
  const headers = ["name", "category", "price", "current_discount", "recommended_discount", "expected_units", "expected_revenue"];
  const rows = data.map((r) => [r.name, r.category, r.price, r.current_discount, r.recommended_discount ?? "", r.expected_units != null ? Math.round(r.expected_units) : "", r.expected_revenue != null ? Math.round(r.expected_revenue) : ""]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "advisory_results.csv"; a.click();
}

export default function DataUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [parseError, setParseError] = useState("");
  const [savedProducts, setSavedProducts] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [activeTab, setActiveTab] = useState("saved"); // "saved" | "upload"
  const fileRef = useRef();

  // Load saved products on mount
  useEffect(() => {
    getUserProducts()
      .then((r) => setSavedProducts(r.data.data || []))
      .catch(() => toast.error("Could not load saved products"))
      .finally(() => setLoadingSaved(false));
  }, []);

  const processFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.name.endsWith(".csv")) { setParseError("Please upload a .csv file."); return; }
    setUploading(true); setParseError(""); setProgress(0);

    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      const results = [...parsed];

      // Run ML predictions in batches of 3
      for (let i = 0; i < results.length; i += 3) {
        const batch = results.slice(i, i + 3);
        await Promise.all(batch.map(async (row) => {
          try {
            const token = localStorage.getItem("da_token");
            const res = await fetch(
              `${process.env.REACT_APP_API_URL || ""}/api/discount-advice-direct?productId=${row.id}&price=${row.price}&category=${encodeURIComponent(row.category)}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            if (data.success) {
              results[row.id] = {
                ...row,
                recommended_discount: data.recommended_discount,
                expected_units: data.expected_sales,
                expected_revenue: data.expected_revenue,
              };
            }
          } catch { /* keep row without ML results */ }
        }));
        setProgress(Math.round(((i + 3) / results.length) * 100));
      }

      setProgress(100);

      // Save to MongoDB
      const saveRes = await saveUserProducts(results);
      const saved = saveRes.data.data || [];
      setSavedProducts(saved);
      setActiveTab("saved");
      toast.success(`${results.length} products saved to your dashboard!`);
    } catch (e) {
      setParseError(e.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, []);

  const handleFile = (e) => processFile(e.target.files[0]);
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); };

  const handleDelete = async (id) => {
    try {
      await deleteUserProduct(id);
      setSavedProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Product removed");
    } catch { toast.error("Failed to delete"); }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete all your uploaded products? This cannot be undone.")) return;
    try {
      await clearUserProducts();
      setSavedProducts([]);
      toast.success("All products cleared");
    } catch { toast.error("Failed to clear"); }
  };

  // ── Analytics from saved products ────────────────────────────
  const withML = savedProducts.filter((p) => p.recommended_discount != null);
  const totalRevenue = withML.reduce((s, p) => s + (p.expected_revenue || 0), 0);
  const needHigher = withML.filter((p) => p.recommended_discount > p.current_discount).length;
  const needLower = withML.filter((p) => p.recommended_discount < p.current_discount).length;

  const catMap = {};
  withML.forEach((p) => { catMap[p.category] = (catMap[p.category] || 0) + (p.expected_revenue || 0); });
  const cats = Object.keys(catMap);

  const revenueChart = {
    labels: withML.map((p) => p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name),
    datasets: [{
      label: "Expected Revenue",
      data: withML.map((p) => Math.round(p.expected_revenue || 0)),
      backgroundColor: withML.map((p) => p.recommended_discount > p.current_discount ? "#10b98130" : "#f59e0b30"),
      borderColor: withML.map((p) => p.recommended_discount > p.current_discount ? "#10b981" : "#f59e0b"),
      borderWidth: 2, borderRadius: 6,
    }],
  };

  const discountChart = {
    labels: withML.map((p) => p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name),
    datasets: [
      { label: "Current %", data: withML.map((p) => p.current_discount), backgroundColor: "#6366f130", borderColor: "#6366f1", borderWidth: 2, borderRadius: 6 },
      { label: "Recommended %", data: withML.map((p) => p.recommended_discount || 0), backgroundColor: "#f59e0b30", borderColor: "#f59e0b", borderWidth: 2, borderRadius: 6 },
    ],
  };

  const doughnutData = cats.length > 0 ? {
    labels: cats,
    datasets: [{
      data: cats.map((c) => Math.round(catMap[c])),
      backgroundColor: ["#f59e0bcc", "#6366f1cc", "#10b981cc", "#ec4899cc", "#3b82f6cc", "#8b5cf6cc", "#f43f5ecc"],
      borderColor: "#111118", borderWidth: 3,
    }],
  } : null;

  const tabStyle = (active) => ({
    padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
    cursor: "pointer", border: "1px solid",
    borderColor: active ? "#f59e0b" : "#1e1e2e",
    background: active ? "#f59e0b12" : "#0a0a0f",
    color: active ? "#f59e0b" : "#475569",
    fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>● Your Data</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", fontFamily: "'Syne', sans-serif" }}>Upload & Manage Products</h1>
          <p style={{ color: "#475569", marginTop: 4, fontSize: 14, fontWeight: 300 }}>
            Upload your own product CSV — predictions are saved to your account and shown on the dashboard.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setActiveTab("saved")} style={tabStyle(activeTab === "saved")}>
            Saved Products {savedProducts.length > 0 && <span style={{ marginLeft: 6, background: "#f59e0b20", color: "#f59e0b", padding: "1px 7px", borderRadius: 999, fontSize: 12 }}>{savedProducts.length}</span>}
          </button>
          <button onClick={() => setActiveTab("upload")} style={tabStyle(activeTab === "upload")}>↑ Upload CSV</button>
        </div>
      </div>

      {/* ── UPLOAD TAB ─────────────────────────────────────── */}
      {activeTab === "upload" && (
        <div className="grid-responsive-1-1" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileRef.current.click()}
            style={{
              border: `2px dashed ${dragging ? "#f59e0b" : "#2a2a3e"}`,
              borderRadius: 14, padding: "48px 24px", textAlign: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              background: dragging ? "#f59e0b06" : "#0a0a0f",
              transition: "all 0.2s",
            }}
          >
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: "none" }} />
            <div style={{ fontSize: 40, marginBottom: 14 }}>{uploading ? "⚙️" : "📂"}</div>
            {!uploading ? (
              <>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>Drop your CSV here</div>
                <div style={{ fontSize: 13, color: "#475569" }}>or click to browse · .csv files only</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b", fontFamily: "'Syne', sans-serif", marginBottom: 14 }}>
                  Running ML predictions… {Math.min(progress, 100)}%
                </div>
                <div style={{ height: 6, background: "#1e1e2e", borderRadius: 999, overflow: "hidden", maxWidth: 280, margin: "0 auto" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#f59e0b,#fbbf24)", borderRadius: 999, transition: "width 0.3s" }} />
                </div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 10 }}>Saving to your account when done…</div>
              </>
            )}
            {parseError && (
              <div style={{ marginTop: 16, background: "#450a0a", border: "1px solid #7f1d1d", color: "#fca5a5", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>{parseError}</div>
            )}
          </div>

          {/* Format guide */}
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 14 }}>CSV Format</div>
            <div style={{ display: "flex", gap: 24, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700, marginBottom: 6 }}>REQUIRED</div>
                {REQUIRED_COLS.map((c) => <div key={c} style={{ fontSize: 12, color: "#34d399", fontFamily: "monospace", marginBottom: 3 }}>• {c}</div>)}
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 6 }}>OPTIONAL</div>
                {OPTIONAL_COLS.map((c) => <div key={c} style={{ fontSize: 12, color: "#fbbf24", fontFamily: "monospace", marginBottom: 3 }}>• {c}</div>)}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.7, marginBottom: 14 }}>
              <b style={{ color: "#64748b" }}>category</b> — Electronics, Clothing, Footwear, Books, Sports, Home, Beauty<br />
              Re-uploading a product with the same name <b style={{ color: "#64748b" }}>updates</b> it instead of duplicating.
            </div>
            <div style={{ background: "#0a0a0f", borderRadius: 8, padding: "10px 14px", border: "1px solid #1e1e2e", fontFamily: "monospace", fontSize: 11, color: "#475569", lineHeight: 1.8, marginBottom: 14, overflow: "auto" }}>
              {SAMPLE_CSV.split("\n").slice(0, 4).join("\n")}…
            </div>
            <button onClick={() => {
              const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "sample_products.csv"; a.click();
            }} className="btn btn-outline" style={{ fontSize: 13, width: "100%", justifyContent: "center" }}>
              ↓ Download Sample CSV
            </button>
          </div>
        </div>
      )}

      {/* ── SAVED PRODUCTS TAB ────────────────────────────── */}
      {activeTab === "saved" && (
        <>
          {loadingSaved ? <div className="spinner" /> : savedProducts.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "64px 40px" }}>
              <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.3 }}>📂</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>No products saved yet</div>
              <div style={{ fontSize: 14, color: "#374151", marginBottom: 20 }}>Upload a CSV to get personalised ML recommendations saved to your account.</div>
              <button onClick={() => setActiveTab("upload")} className="btn btn-primary">↑ Upload CSV</button>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid-responsive-1-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Your Products", value: savedProducts.length, color: "#f59e0b" },
                  { label: "Total Exp. Revenue", value: "$" + Math.round(totalRevenue).toLocaleString(), color: "#10b981" },
                  { label: "Increase Discount", value: needHigher, color: "#6366f1" },
                  { label: "Reduce Discount", value: needLower, color: "#ec4899" },
                ].map(({ label, value, color }) => (
                  <div className="card" key={label} style={{ position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: color + "10" }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif" }}>{label}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: "'Syne', sans-serif", marginTop: 6 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              {withML.length > 0 && (
                <>
                  <div className="grid-responsive-2-1" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginBottom: 20 }}>
                    <div className="card">
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>Expected Revenue per Product</div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 18, fontFamily: "'Syne', sans-serif" }}>
                        <span style={{ color: "#10b981" }}>Green</span> = increase · <span style={{ color: "#f59e0b" }}>Amber</span> = maintain / reduce
                      </div>
                      <Bar data={revenueChart} options={chartOpts} />
                    </div>
                    {doughnutData && (
                      <div className="card">
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>Revenue by Category</div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>Your portfolio</div>
                        <Doughnut data={doughnutData} options={{ responsive: true, cutout: "65%", plugins: { legend: { position: "bottom", labels: { color: "#475569", font: { family: "'DM Sans'", size: 10 }, boxWidth: 8, padding: 10 } }, tooltip: { backgroundColor: "#16161f", borderColor: "#2a2a3e", borderWidth: 1, titleColor: "#e2e8f0", bodyColor: "#94a3b8" } } }} />
                      </div>
                    )}
                  </div>

                  <div className="card" style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>Current vs Recommended Discount</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 18, fontFamily: "'Syne', sans-serif" }}>Side-by-side comparison</div>
                    <Bar data={discountChart} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { position: "top", labels: { color: "#94a3b8", font: { family: "'DM Sans'" }, boxWidth: 12 } } } }} />
                  </div>
                </>
              )}

              {/* Table */}
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif" }}>
                    All Saved Products
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => downloadCSV(savedProducts)} className="btn btn-outline" style={{ fontSize: 13, padding: "7px 14px" }}>↓ Export CSV</button>
                    <button onClick={() => setActiveTab("upload")} className="btn btn-primary" style={{ fontSize: 13, padding: "7px 14px" }}>↑ Upload More</button>
                    <button onClick={handleClearAll} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #7f1d1d", background: "transparent", color: "#ef4444", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                      Clear All
                    </button>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 750 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
                        {["Product", "Category", "Price", "Current %", "Recommended %", "Exp. Units", "Exp. Revenue", "Change", ""].map((h) => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#374151", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {savedProducts.map((p) => {
                        const up = p.recommended_discount > p.current_discount;
                        const down = p.recommended_discount < p.current_discount;
                        return (
                          <tr key={p._id} style={{ borderBottom: "1px solid #16161f" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#16161f"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{p.name}</div>
                              {p.brand && <div style={{ fontSize: 11, color: "#374151" }}>{p.brand}</div>}
                            </td>
                            <td style={{ padding: "12px 14px", fontSize: 12, color: "#64748b", textTransform: "capitalize" }}>{p.category}</td>
                            <td style={{ padding: "12px 14px", fontWeight: 700, color: "#e2e8f0", fontFamily: "'Syne', sans-serif" }}>₹{p.price.toLocaleString()}</td>
                            <td style={{ padding: "12px 14px" }}><span className="badge" style={{ background: "#6366f120", color: "#818cf8" }}>{p.current_discount}%</span></td>
                            <td style={{ padding: "12px 14px" }}>
                              {p.recommended_discount != null
                                ? <span className="badge badge-warning">{p.recommended_discount}%</span>
                                : <span style={{ fontSize: 12, color: "#374151" }}>—</span>}
                            </td>
                            <td style={{ padding: "12px 14px", color: "#94a3b8", fontSize: 13 }}>
                              {p.expected_units != null ? Math.round(p.expected_units) : "—"}
                            </td>
                            <td style={{ padding: "12px 14px", fontWeight: 700, color: "#e2e8f0", fontFamily: "'Syne', sans-serif" }}>
                              {p.expected_revenue != null ? "₹" + Math.round(p.expected_revenue).toLocaleString() : "—"}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              {p.recommended_discount == null ? <span style={{ fontSize: 12, color: "#374151" }}>—</span>
                                : up ? <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>▲ +{p.recommended_discount - p.current_discount}%</span>
                                : down ? <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444" }}>▼ {p.recommended_discount - p.current_discount}%</span>
                                : <span style={{ fontSize: 12, color: "#374151" }}>— optimal</span>}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <button onClick={() => handleDelete(p._id)} style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: 16, padding: 4 }}
                                onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                                onMouseLeave={(e) => e.currentTarget.style.color = "#374151"}
                              >✕</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
