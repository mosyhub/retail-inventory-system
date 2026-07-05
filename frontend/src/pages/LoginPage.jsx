// src/pages/LoginPage.jsx
//
// Login page with role selection, remember me, forgot password,
// and a modern two-panel split layout.
// Public signup is disabled per specifications.

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve saved email if Remember Me was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("Email and password are required");
      }

      // login() returns { user, idToken } — capture it immediately
      const result = await login(email, password);

      // Write to localStorage NOW so AuthContext's sync restore fires
      // before ProtectedRoute renders on the next route.
      if (result?.idToken && result?.user) {
        localStorage.setItem("idToken", result.idToken);
        localStorage.setItem("currentUser", JSON.stringify(result.user));
      }

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter', sans-serif", background: "#f9fafb" }}>
      {/* Left panel */}
      <div style={{
        display: "none",
        width: "45%",
        background: "var(--sidebar-bg, #111827)",
        color: "#fff",
        padding: "48px",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
      }} className="md-flex-show">
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: "-120px", left: "-120px", width: "320px", height: "320px", background: "#2563eb", borderRadius: "50%", filter: "blur(80px)", opacity: 0.15, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-120px", right: "-120px", width: "320px", height: "320px", background: "#10b981", borderRadius: "50%", filter: "blur(80px)", opacity: 0.08, pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "#2563eb", borderRadius: "8px", padding: "8px 10px", fontWeight: "800", fontSize: "0.9rem", color: "#fff" }}>SW</div>
          <span style={{ fontWeight: "700", fontSize: "1rem", letterSpacing: "0.02em" }}>StockWise Retail</span>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "800", lineHeight: 1.1, margin: "0 0 16px" }}>
            Smarter<br />Inventory,<br />Better Results.
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "1rem", lineHeight: 1.6, margin: 0 }}>
            Manage inventory in real time, automate transactions, and forecast stock requirements instantly.
          </p>
          <div style={{ marginTop: "40px", display: "flex", gap: "24px" }}>
            {[["Real-time", "Stock tracking"], ["AI-powered", "Predictions"], ["Role-based", "Access control"]].map(([t, s]) => (
              <div key={t}>
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: "700", color: "#f9fafb" }}>{t}</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280" }}>{s}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1, fontSize: "0.72rem", color: "#4b5563" }}>
          © {new Date().getFullYear()} StockWise Retail Inventory System
        </div>
      </div>

      {/* Right panel: Login form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
        <div style={{
          width: "100%", maxWidth: "420px",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
          padding: "40px 36px",
        }}>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-gray-900">Sign In</h2>
            <p className="text-gray-500 text-sm">Welcome back! Please enter your details.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@store.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-800"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-800"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-600">Remember Me</span>
              </label>
              <button
                type="button"
                onClick={() => alert("Please contact system administrator to reset password.")}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-semibold text-white transition ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 cursor-pointer active:scale-[0.98]"
              }`}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
