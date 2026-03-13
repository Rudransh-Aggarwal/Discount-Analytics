import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  .auth-root {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    font-family: 'DM Sans', sans-serif;
    background: #0a0a0f;
  }

  .auth-left {
    position: relative;
    background: #0a0a0f;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px;
    overflow: hidden;
  }

  .auth-left::before {
    content: '';
    position: absolute;
    width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, #6366f118 0%, transparent 70%);
    top: -100px; left: -100px;
    pointer-events: none;
  }

  .auth-left::after {
    content: '';
    position: absolute;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, #f59e0b15 0%, transparent 70%);
    bottom: 100px; right: -50px;
    pointer-events: none;
  }

  .auth-logo {
    display: flex; align-items: center; gap: 10px; position: relative; z-index: 1;
  }

  .auth-logo-badge {
    width: 38px; height: 38px;
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 16px;
    color: #0a0a0f; box-shadow: 0 0 20px #f59e0b40;
  }

  .auth-logo-text {
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 16px;
    color: #fff; letter-spacing: -0.02em;
  }

  .auth-steps { position: relative; z-index: 1; }

  .auth-steps h2 {
    font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800;
    color: #fff; letter-spacing: -0.03em; margin-bottom: 10px;
  }

  .auth-steps h2 span { color: #f59e0b; }

  .auth-steps > p {
    font-size: 14px; color: #64748b; font-weight: 300;
    line-height: 1.7; margin-bottom: 36px;
  }

  .step-list { display: flex; flex-direction: column; gap: 20px; }

  .step-item {
    display: flex; align-items: flex-start; gap: 14px;
  }

  .step-num {
    width: 32px; height: 32px; min-width: 32px;
    background: #1e1e2e;
    border: 1px solid #2a2a3e;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 800;
    color: #f59e0b;
  }

  .step-content h4 {
    font-size: 14px; font-weight: 600; color: #e2e8f0; margin-bottom: 2px;
  }

  .step-content p {
    font-size: 13px; color: #475569; font-weight: 300; line-height: 1.5;
  }

  .auth-note {
    display: flex; align-items: center; gap: 10px;
    background: #f59e0b08;
    border: 1px solid #f59e0b20;
    border-radius: 10px;
    padding: 14px 16px;
    position: relative; z-index: 1;
  }

  .auth-note-icon { font-size: 18px; }

  .auth-note p { font-size: 12px; color: #92400e; }
  .auth-note p strong { color: #fbbf24; }

  .auth-right {
    background: #111118;
    display: flex; align-items: center; justify-content: center;
    padding: 48px 56px;
    border-left: 1px solid #1e1e2e;
  }

  .auth-form-wrap { width: 100%; max-width: 380px; }

  .auth-form-header { margin-bottom: 32px; }

  .auth-form-header h2 {
    font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800;
    color: #fff; letter-spacing: -0.02em; margin-bottom: 8px;
  }

  .auth-form-header p { font-size: 14px; color: #64748b; }

  .auth-form-header p a { color: #f59e0b; font-weight: 500; text-decoration: none; }
  .auth-form-header p a:hover { text-decoration: underline; }

  .auth-field { margin-bottom: 16px; }

  .auth-field label {
    display: block; font-size: 12px; font-weight: 600;
    color: #94a3b8; margin-bottom: 7px;
    letter-spacing: 0.06em; text-transform: uppercase;
  }

  .auth-field input, .auth-field select {
    width: 100%; padding: 12px 16px;
    background: #0a0a0f; border: 1px solid #1e1e2e;
    border-radius: 10px; font-size: 14px; color: #fff;
    font-family: 'DM Sans', sans-serif; font-weight: 400;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }

  .auth-field input::placeholder { color: #374151; }
  .auth-field select option { background: #111118; }

  .auth-field input:focus, .auth-field select:focus {
    border-color: #f59e0b60;
    box-shadow: 0 0 0 3px #f59e0b10;
  }

  .role-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }

  .role-card {
    padding: 10px 8px; border-radius: 10px;
    border: 1.5px solid #1e1e2e; background: #0a0a0f;
    cursor: pointer; text-align: center;
    transition: all 0.2s;
  }

  .role-card:hover { border-color: #2a2a3e; }

  .role-card.selected {
    border-color: #f59e0b;
    background: #f59e0b08;
    box-shadow: 0 0 0 3px #f59e0b10;
  }

  .role-card-icon { font-size: 18px; margin-bottom: 4px; }

  .role-card-label {
    font-size: 12px; font-weight: 600;
    color: #94a3b8;
  }

  .role-card.selected .role-card-label { color: #fbbf24; }

  .strength-bar {
    height: 3px; background: #1e1e2e;
    border-radius: 999px; margin-top: 8px; overflow: hidden;
  }

  .strength-fill {
    height: 100%; border-radius: 999px;
    transition: width 0.3s, background 0.3s;
  }

  .auth-btn {
    width: 100%; padding: 13px;
    background: #f59e0b; border: none; border-radius: 10px;
    font-size: 15px; font-weight: 700;
    font-family: 'Syne', sans-serif;
    color: #0a0a0f; cursor: pointer;
    letter-spacing: 0.01em; transition: all 0.2s;
    margin-top: 8px; box-shadow: 0 4px 20px #f59e0b30;
  }

  .auth-btn:hover:not(:disabled) {
    background: #fbbf24; transform: translateY(-1px);
    box-shadow: 0 6px 28px #f59e0b40;
  }

  .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .auth-terms {
    text-align: center; margin-top: 14px;
    font-size: 12px; color: #374151; line-height: 1.6;
  }

  .auth-error {
    background: #450a0a; border: 1px solid #7f1d1d;
    color: #fca5a5; padding: 11px 14px;
    border-radius: 8px; font-size: 13px; margin-bottom: 18px;
  }

  @media (max-width: 768px) {
    .auth-root { grid-template-columns: 1fr; }
    .auth-left { display: none; }
    .auth-right { padding: 40px 24px; }
  }
`;

const ROLES = [
  { value: "admin", label: "Admin", icon: "🛡️" },
  { value: "analyst", label: "Analyst", icon: "📊" },
  { value: "viewer", label: "Viewer", icon: "👁️" },
];

function getStrength(pw) {
  if (!pw) return { width: "0%", color: "#374151", label: "" };
  if (pw.length < 6) return { width: "25%", color: "#ef4444", label: "Weak" };
  if (pw.length < 8) return { width: "50%", color: "#f59e0b", label: "Fair" };
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) return { width: "100%", color: "#10b981", label: "Strong" };
  return { width: "75%", color: "#6366f1", label: "Good" };
}

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "analyst" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const strength = getStrength(form.password);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.role);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="auth-root">
        {/* Left Panel */}
        <div className="auth-left">
          <div className="auth-logo">
            <div className="auth-logo-badge">DA</div>
            <span className="auth-logo-text">Discount Advisory</span>
          </div>

          <div className="auth-steps">
            <h2>Start making <span>data-driven</span> decisions.</h2>
            <p>Set up your account and access ML-powered discount recommendations in minutes.</p>

            <div className="step-list">
              {[
                { n: "01", title: "Create your account", desc: "Pick a role — Admin, Analyst, or Viewer — to match your access needs." },
                { n: "02", title: "Load your products", desc: "Your product catalog and 3,600 sales records are pre-seeded and ready." },
                { n: "03", title: "Get ML recommendations", desc: "The Random Forest model runs instantly and advises your optimal discount." },
              ].map(({ n, title, desc }) => (
                <div className="step-item" key={n}>
                  <div className="step-num">{n}</div>
                  <div className="step-content">
                    <h4>{title}</h4>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-note">
            <div className="auth-note-icon">💡</div>
            <p><strong>Demo mode:</strong> Use any email — the dataset and model are already trained and ready to explore.</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-right">
          <div className="auth-form-wrap">
            <div className="auth-form-header">
              <h2>Create account</h2>
              <p>Already have one? <Link to="/login">Sign in →</Link></p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label>Full name</label>
                <input
                  type="text" name="name"
                  value={form.name} onChange={handleChange}
                  placeholder="Riya Sharma" required autoFocus
                />
              </div>

              <div className="auth-field">
                <label>Email address</label>
                <input
                  type="email" name="email"
                  value={form.email} onChange={handleChange}
                  placeholder="you@company.com" required
                />
              </div>

              <div className="auth-field">
                <label>Password</label>
                <input
                  type="password" name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="Min. 6 characters" required
                />
                {form.password && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <div className="strength-bar" style={{ flex: 1 }}>
                      <div className="strength-fill" style={{ width: strength.width, background: strength.color }} />
                    </div>
                    <span style={{ fontSize: 11, color: strength.color, fontWeight: 600, minWidth: 40 }}>{strength.label}</span>
                  </div>
                )}
              </div>

              <div className="auth-field">
                <label>Your role</label>
                <div className="role-grid">
                  {ROLES.map((r) => (
                    <div
                      key={r.value}
                      className={`role-card ${form.role === r.value ? "selected" : ""}`}
                      onClick={() => setForm({ ...form, role: r.value })}
                    >
                      <div className="role-card-icon">{r.icon}</div>
                      <div className="role-card-label">{r.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Creating account..." : "Create account →"}
              </button>
            </form>

            <p className="auth-terms">
              By signing up you agree to the <span style={{ color: "#f59e0b" }}>Terms of Service</span> and <span style={{ color: "#f59e0b" }}>Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
