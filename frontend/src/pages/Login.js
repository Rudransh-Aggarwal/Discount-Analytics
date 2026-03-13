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

  /* LEFT PANEL */
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
    background: radial-gradient(circle, #f59e0b18 0%, transparent 70%);
    top: -100px; left: -100px;
    pointer-events: none;
  }

  .auth-left::after {
    content: '';
    position: absolute;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, #6366f120 0%, transparent 70%);
    bottom: 100px; right: -50px;
    pointer-events: none;
  }

  .auth-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    position: relative;
    z-index: 1;
  }

  .auth-logo-badge {
    width: 38px; height: 38px;
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 16px;
    color: #0a0a0f;
    box-shadow: 0 0 20px #f59e0b40;
  }

  .auth-logo-text {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 16px;
    color: #fff;
    letter-spacing: -0.02em;
  }

  .auth-hero {
    position: relative;
    z-index: 1;
  }

  .auth-hero-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    background: #f59e0b18;
    border: 1px solid #f59e0b30;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
    color: #fbbf24;
    margin-bottom: 24px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .auth-hero-tag::before {
    content: '';
    width: 6px; height: 6px;
    background: #f59e0b;
    border-radius: 50%;
    box-shadow: 0 0 8px #f59e0b;
  }

  .auth-hero h1 {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 42px;
    line-height: 1.1;
    color: #fff;
    letter-spacing: -0.03em;
    margin-bottom: 18px;
  }

  .auth-hero h1 span {
    color: #f59e0b;
  }

  .auth-hero p {
    font-size: 15px;
    color: #94a3b8;
    font-weight: 300;
    line-height: 1.7;
    max-width: 380px;
  }

  .auth-stats {
    display: flex;
    gap: 32px;
    position: relative;
    z-index: 1;
  }

  .auth-stat-item {
    border-left: 2px solid #f59e0b40;
    padding-left: 16px;
  }

  .auth-stat-val {
    font-family: 'Syne', sans-serif;
    font-size: 26px;
    font-weight: 800;
    color: #fff;
  }

  .auth-stat-label {
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
    font-weight: 400;
  }

  /* RIGHT PANEL */
  .auth-right {
    background: #111118;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 56px;
    border-left: 1px solid #1e1e2e;
  }

  .auth-form-wrap {
    width: 100%;
    max-width: 380px;
  }

  .auth-form-header {
    margin-bottom: 36px;
  }

  .auth-form-header h2 {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.02em;
    margin-bottom: 8px;
  }

  .auth-form-header p {
    font-size: 14px;
    color: #64748b;
    font-weight: 400;
  }

  .auth-form-header p a {
    color: #f59e0b;
    font-weight: 500;
    text-decoration: none;
  }

  .auth-form-header p a:hover { text-decoration: underline; }

  .auth-field {
    margin-bottom: 18px;
  }

  .auth-field label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 7px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .auth-field input {
    width: 100%;
    padding: 12px 16px;
    background: #0a0a0f;
    border: 1px solid #1e1e2e;
    border-radius: 10px;
    font-size: 14px;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-weight: 400;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .auth-field input::placeholder { color: #374151; }

  .auth-field input:focus {
    border-color: #f59e0b60;
    box-shadow: 0 0 0 3px #f59e0b10;
  }

  .auth-btn {
    width: 100%;
    padding: 13px;
    background: #f59e0b;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 700;
    font-family: 'Syne', sans-serif;
    color: #0a0a0f;
    cursor: pointer;
    letter-spacing: 0.01em;
    transition: all 0.2s;
    margin-top: 8px;
    box-shadow: 0 4px 20px #f59e0b30;
  }

  .auth-btn:hover:not(:disabled) {
    background: #fbbf24;
    transform: translateY(-1px);
    box-shadow: 0 6px 28px #f59e0b40;
  }

  .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .auth-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 22px 0;
  }

  .auth-divider span {
    height: 1px;
    flex: 1;
    background: #1e1e2e;
  }

  .auth-divider p {
    font-size: 12px;
    color: #374151;
  }

  .auth-error {
    background: #450a0a;
    border: 1px solid #7f1d1d;
    color: #fca5a5;
    padding: 11px 14px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 18px;
  }

  @media (max-width: 768px) {
    .auth-root { grid-template-columns: 1fr; }
    .auth-left { display: none; }
    .auth-right { padding: 40px 24px; }
  }
`;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
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

          <div className="auth-hero">
            <div className="auth-hero-tag">ML-Powered Analytics</div>
            <h1>
              Price smarter.<br />
              Sell <span>more.</span>
            </h1>
            <p>
              Harness machine learning to find the optimal discount for every product — maximising revenue without guesswork.
            </p>
          </div>

          <div className="auth-stats">
            <div className="auth-stat-item">
              <div className="auth-stat-val">75+</div>
              <div className="auth-stat-label">Products tracked</div>
            </div>
            <div className="auth-stat-item">
              <div className="auth-stat-val">3.6K</div>
              <div className="auth-stat-label">Sales records</div>
            </div>
            <div className="auth-stat-item">
              <div className="auth-stat-val">RF</div>
              <div className="auth-stat-label">Random Forest model</div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-right">
          <div className="auth-form-wrap">
            <div className="auth-form-header">
              <h2>Welcome back</h2>
              <p>
                Don't have an account?{" "}
                <Link to="/signup">Create one →</Link>
              </p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label>Email address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  required
                  autoFocus
                />
              </div>

              <div className="auth-field">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Signing in..." : "Sign in →"}
              </button>
            </form>

            <div className="auth-divider">
              <span /><p>or continue with demo</p><span />
            </div>

            <button
              className="auth-btn"
              style={{ background: "#1e1e2e", color: "#94a3b8", boxShadow: "none", border: "1px solid #2a2a3e" }}
              onClick={() => {
                setForm({ email: "demo@example.com", password: "demo123" });
              }}
            >
              Use demo credentials
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
