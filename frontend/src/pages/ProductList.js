import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts, searchProducts } from "../utils/api";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    getProducts(100)
      .then((r) => setProducts(r.data.products || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (val.length > 2) {
      searchProducts(val).then((r) => setProducts(r.data.products || []));
    } else if (val.length === 0) {
      getProducts(100).then((r) => setProducts(r.data.products || []));
    }
  };

  const categories = ["All", ...new Set(products.map((p) => p.category))];
  const filtered = category === "All" ? products : products.filter((p) => p.category === category);

  const avgPrice = filtered.length
    ? Math.round(filtered.reduce((s, p) => s + p.price, 0) / filtered.length) : 0;

  if (loading) return <div className="spinner" />;
  if (error) return <div className="error-box">Error: {error}</div>;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          ● Live via DummyJSON API
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", fontFamily: "'Syne', sans-serif" }}>
          Product Catalog
        </h1>
        <p style={{ color: "#475569", marginTop: 4, fontSize: 14 }}>
          {products.length} real products · ML-powered discount advisory
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Showing", value: filtered.length, color: "#f59e0b" },
          { label: "Categories", value: categories.length - 1, color: "#6366f1" },
          { label: "Avg Price", value: `$${avgPrice}`, color: "#10b981" },
        ].map(({ label, value, color }) => (
          <div className="card" key={label} style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne', sans-serif" }}>{label}</div>
            <div style={{ fontSize: 30, fontWeight: 900, color, fontFamily: "'Syne', sans-serif", marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={handleSearch}
          style={{
            padding: "9px 14px", borderRadius: 8,
            border: "1px solid #1e1e2e", background: "#111118",
            fontSize: 14, outline: "none", width: 240, color: "#e2e8f0",
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {categories.slice(0, 10).map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: "6px 12px", borderRadius: 7, border: "1px solid",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              borderColor: category === cat ? "#f59e0b" : "#1e1e2e",
              background: category === cat ? "#f59e0b12" : "#111118",
              color: category === cat ? "#f59e0b" : "#475569",
              fontFamily: "'DM Sans', sans-serif", textTransform: "capitalize",
            }}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {filtered.map((p) => (
          <div key={p.id} className="card" style={{ padding: 0, overflow: "hidden", transition: "border-color 0.2s" }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "#f59e0b30"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "#1e1e2e"}
          >
            <div style={{
              height: 160, background: "#0a0a0f",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              <img src={p.thumbnail} alt={p.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#475569", textTransform: "capitalize", marginBottom: 4 }}>{p.category}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 8, lineHeight: 1.3,
                overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {p.title}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b", fontFamily: "'Syne', sans-serif" }}>
                  ${p.price}
                </span>
                {p.discountPercentage > 0 && (
                  <span style={{ fontSize: 11, background: "#10b98120", color: "#34d399", padding: "2px 7px", borderRadius: 999, fontWeight: 700 }}>
                    -{Math.round(p.discountPercentage)}% off
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 12, color: "#374151" }}>
                  ⭐ {p.rating} · {p.stock} in stock
                </div>
                <Link to={`/product/${p.id}`}
                  state={{ product: p }}
                  style={{
                    fontSize: 12, fontWeight: 700, color: "#f59e0b",
                    fontFamily: "'Syne', sans-serif", letterSpacing: "0.02em",
                  }}>
                  Advise →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#374151" }}>No products found.</div>
      )}
    </div>
  );
}
