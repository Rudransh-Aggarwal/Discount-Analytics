import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const links = [
    { to: "/", label: "Home" },
    { to: "/products", label: "Products" },
    { to: "/simulator", label: "Simulator" },
    { to: "/upload", label: "Upload CSV" },
  ];

  const handleLogout = () => { logout(); navigate("/login"); };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const roleColor = { admin: "#f59e0b", analyst: "#6366f1", viewer: "#10b981" }[user?.role] || "#6366f1";

  return (
    <nav style={{
      background: "#111118", borderBottom: "1px solid #1e1e2e",
      padding: "0 28px", display: "flex", alignItems: "center",
      justifyContent: "space-between", height: 60,
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
            borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 13,
            color: "#0a0a0f", boxShadow: "0 0 16px #f59e0b30",
          }}>DA</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#fff" }}>
            Discount Advisory
          </span>
        </Link>

        {user && (
          <div style={{ display: "flex", gap: 2 }}>
            {links.map(({ to, label }) => {
              const active = pathname === to;
              return (
                <Link key={to} to={to} style={{
                  padding: "6px 14px", borderRadius: 7, fontSize: 14, fontWeight: 500,
                  color: active ? "#f59e0b" : "#64748b",
                  background: active ? "#f59e0b12" : "transparent",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  {to === "/upload" && <span style={{ fontSize: 12 }}>↑</span>}
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {user && (
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowMenu((v) => !v)} style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#16161f", border: "1px solid #2a2a3e",
            borderRadius: 999, padding: "5px 14px 5px 6px", cursor: "pointer",
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: roleColor + "20", border: `2px solid ${roleColor}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: roleColor,
              fontFamily: "'Syne', sans-serif",
            }}>{initials}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.2 }}>{user.name}</div>
              <div style={{ fontSize: 11, color: "#475569", textTransform: "capitalize" }}>{user.role}</div>
            </div>
            <span style={{ fontSize: 10, color: "#475569" }}>▾</span>
          </button>

          {showMenu && (
            <div onMouseLeave={() => setShowMenu(false)} style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              background: "#111118", border: "1px solid #1e1e2e",
              borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              minWidth: 190, zIndex: 200, overflow: "hidden",
            }}>
              <div style={{ padding: "13px 16px", borderBottom: "1px solid #1e1e2e" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{user.name}</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 1 }}>{user.email}</div>
                <span style={{
                  display: "inline-block", marginTop: 6, padding: "2px 8px",
                  borderRadius: 999, fontSize: 11, fontWeight: 700,
                  background: roleColor + "18", color: roleColor, textTransform: "capitalize",
                }}>{user.role}</span>
              </div>
              <button onClick={handleLogout}
                onMouseEnter={(e) => e.currentTarget.style.background = "#450a0a20"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                style={{
                  width: "100%", padding: "11px 16px", background: "none", border: "none",
                  textAlign: "left", fontSize: 13, color: "#ef4444",
                  cursor: "pointer", fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                }}>→ Sign out</button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
