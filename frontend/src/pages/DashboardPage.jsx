// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import SalesChart from "../components/charts/SalesChart.jsx";

const StatCard = ({ label, value, sub, accent = "#2563eb", accentBg = "#eff6ff", icon }) => (
  <div style={{
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px 22px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  }}>
    <div>
      <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{label}</p>
      <p style={{ fontSize: "2rem", fontWeight: "800", color: "#111827", margin: "8px 0 0", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "6px" }}>{sub}</p>}
    </div>
    <div style={{ background: accentBg, borderRadius: "10px", padding: "10px", flexShrink: 0 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={icon} />
      </svg>
    </div>
  </div>
);

export default function DashboardPage() {
  const { currentUser, logout } = useAuth();
  const [stats, setStats] = useState({
    today: { orders: 0, revenue: 0 },
    inventory: { totalProducts: 0, lowStock: 0, outOfStock: 0, value: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);

  const isManagerOrAdmin = ["manager", "admin"].includes(currentUser?.role);
  const canPOS = ["cashier", "manager", "admin"].includes(currentUser?.role);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const requests = [
        api.get("/reports/dashboard-stats"),
        api.get("/inventory/transactions", { params: { limit: 5 } }),
        api.get("/inventory/low-stock"),
      ];

      if (isManagerOrAdmin) {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 6);
        const sd = startDate.toISOString().split("T")[0];
        const ed = today.toISOString().split("T")[0];
        requests.push(
          api.get("/reports/sales-report", { params: { startDate: sd, endDate: ed, groupBy: "daily" } }),
          api.get("/reports/top-products", { params: { startDate: sd, endDate: ed, limit: 5 } }),
          api.get("/reports/sales-by-category", { params: { startDate: sd, endDate: ed } })
        );
      }

      const [statsRes, txnRes, lowStockRes, salesRes, topRes, categoryRes] = await Promise.all(requests);

      setStats(statsRes.data.stats);
      setRecentTransactions(txnRes.data.transactions || []);
      setLowStockProducts(lowStockRes.data.products || []);
      if (salesRes)    setSalesTrend(salesRes.data.report?.data || []);
      if (topRes)      setTopProducts(topRes.data.products || []);
      if (categoryRes) setCategoryBreakdown(categoryRes.data.breakdown || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", animationName: "fadeIn", animationDuration: "0.3s" }}>

      {/* Welcome */}
      <div>
        <p style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: "500", margin: 0 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
        <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#111827", margin: "4px 0 0" }}>
          Welcome back, {currentUser?.firstName} 👋
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginTop: "4px" }}>
          Here's what's happening in your store today.
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <StatCard
          label="Total Products"
          value={loading ? "—" : fmt(stats.inventory.totalProducts)}
          sub="In catalog"
          accent="#2563eb" accentBg="#eff6ff"
          icon="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        />
        <StatCard
          label="Low Stock"
          value={loading ? "—" : fmt(stats.inventory.lowStock)}
          sub="Need reorder"
          accent="#d97706" accentBg="#fffbeb"
          icon="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01"
        />
        <StatCard
          label="Today's Orders"
          value={loading ? "—" : fmt(stats.today.orders)}
          sub="Transactions today"
          accent="#16a34a" accentBg="#f0fdf4"
          icon="M18 20V10 M12 20V4 M6 20v-6"
        />
        <StatCard
          label="Today's Revenue"
          value={loading ? "—" : `₱${fmt(stats.today.revenue)}`}
          sub="Sales today"
          accent="#7c3aed" accentBg="#f5f3ff"
          icon="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
        />
      </div>

      {/* Sales chart + Low Stock */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px" }}>
        <div className="card" style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "#111827" }}>Sales Trend</h3>
              <p style={{ margin: "3px 0 0", fontSize: "0.78rem", color: "#9ca3af" }}>Last 7 days of activity</p>
            </div>
            <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "#2563eb", background: "#eff6ff", padding: "3px 9px", borderRadius: "99px" }}>Live</span>
          </div>
          {isManagerOrAdmin ? (
            <SalesChart data={salesTrend} />
          ) : (
            <div style={{
              height: "240px", border: "2px dashed #e5e7eb", borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#9ca3af", fontSize: "0.875rem", textAlign: "center", padding: "24px",
            }}>
              Sales trend is available to managers and administrators.
            </div>
          )}
        </div>

        <div className="card" style={{ padding: "22px 24px" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "0.95rem", fontWeight: "700", color: "#111827" }}>⚠️ Low Stock Alerts</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto" }}>
            {loading ? (
              <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Loading...</p>
            ) : lowStockProducts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", fontSize: "0.875rem" }}>
                ✅ All items are well stocked
              </div>
            ) : (
              lowStockProducts.slice(0, 7).map((p) => (
                <div key={p.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 12px", background: "#fffbeb", borderRadius: "8px",
                  border: "1px solid #fde68a",
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: "600", color: "#111827" }}>{p.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#9ca3af" }}>{p.category}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: "700", color: "#b45309" }}>{p.stock} left</p>
                    <p style={{ margin: "1px 0 0", fontSize: "0.68rem", color: "#d97706" }}>Reorder: {p.reorderLevel}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Inventory Overview + Recent Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Inventory Overview */}
        <div className="card" style={{ padding: "22px 24px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "0.95rem", fontWeight: "700", color: "#111827" }}>Inventory Overview</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { label: "Inventory Value", val: `₱${fmt(stats.inventory.value)}`, color: "#2563eb", bg: "#eff6ff" },
              { label: "Low Stock Products", val: fmt(stats.inventory.lowStock), color: "#d97706", bg: "#fffbeb" },
              { label: "Out of Stock", val: fmt(stats.inventory.outOfStock), color: "#dc2626", bg: "#fef2f2" },
            ].map(({ label, val, color, bg }) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px", background: bg, borderRadius: "9px",
              }}>
                <span style={{ fontSize: "0.875rem", color: "#374151", fontWeight: "500" }}>{label}</span>
                <span style={{ fontSize: "1rem", fontWeight: "800", color }}>{loading ? "—" : val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card" style={{ padding: "22px 24px" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "0.95rem", fontWeight: "700", color: "#111827" }}>Recent Activity</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentTransactions.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: "0.875rem", textAlign: "center", padding: "24px 0" }}>No recent activity</p>
            ) : (
              recentTransactions.slice(0, 5).map((txn) => (
                <div key={txn.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "9px 12px", background: "#f9fafb", borderRadius: "8px",
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: "600", color: "#111827" }}>{txn.productName}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#9ca3af", textTransform: "capitalize" }}>
                      {txn.type?.replace("_", " ")} · {txn.quantity} units
                    </p>
                  </div>
                  <span className={`badge ${txn.type === "stock_in" ? "badge-green" : txn.type === "stock_out" || txn.type === "sale" ? "badge-red" : "badge-blue"}`}>
                    {txn.type === "stock_in" ? "+" : txn.type === "adjustment" ? "~" : "-"}{txn.quantity}
                  </span>
                </div>
              ))
            )}
          </div>
          <Link to="/inventory" style={{
            display: "block", marginTop: "14px", textAlign: "center",
            fontSize: "0.8rem", color: "#2563eb", fontWeight: "600", textDecoration: "none",
          }}>
            View All Activity →
          </Link>
        </div>
      </div>

      {/* Top Products + Category Breakdown (managers only) */}
      {isManagerOrAdmin && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div className="card" style={{ padding: "22px 24px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "0.95rem", fontWeight: "700", color: "#111827" }}>Top Selling Products</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {topProducts.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No sales data yet.</p>
              ) : (
                topProducts.map((p, i) => (
                  <div key={p.productId || i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "9px 12px", background: "#f9fafb", borderRadius: "8px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{
                        width: "22px", height: "22px", borderRadius: "50%",
                        background: i === 0 ? "#fef9c3" : "#f3f4f6",
                        color: i === 0 ? "#854d0e" : "#6b7280",
                        fontSize: "0.7rem", fontWeight: "700",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{i + 1}</span>
                      <div>
                        <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: "600", color: "#111827" }}>{p.productName}</p>
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{p.sku}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: "700", color: "#111827" }}>{p.quantity} sold</p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>₱{fmt(p.revenue)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card" style={{ padding: "22px 24px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "0.95rem", fontWeight: "700", color: "#111827" }}>Sales by Category</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {categoryBreakdown.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No category data yet.</p>
              ) : (
                categoryBreakdown.map((cat) => {
                  const max = Math.max(...categoryBreakdown.map((c) => c.revenue || 0), 1);
                  const pct = ((cat.revenue || 0) / max) * 100;
                  return (
                    <div key={cat.category}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "#374151" }}>{cat.category}</span>
                        <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#111827" }}>₱{fmt(cat.revenue)}</span>
                      </div>
                      <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "#2563eb", borderRadius: "99px", transition: "width 0.5s ease" }} />
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#9ca3af" }}>{cat.quantity} items sold</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card" style={{ padding: "22px 24px" }}>
        <h3 style={{ margin: "0 0 14px", fontSize: "0.95rem", fontWeight: "700", color: "#111827" }}>Quick Actions</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
          {[
            { to: "/products",             label: "Products",    sub: "Manage items",    icon: "📦", bg: "#eff6ff" },
            { to: "/inventory",            label: "Inventory",   sub: "Stock movements", icon: "🔄", bg: "#fffbeb" },
            canPOS && { to: "/pos",        label: "New Sale",    sub: "Create order",    icon: "🛒", bg: "#f0fdf4" },
            { to: "/predictions",          label: "Predictions", sub: "Stock forecast",  icon: "🔮", bg: "#f5f3ff" },
            isManagerOrAdmin && { to: "/reports", label: "Reports", sub: "Analytics",   icon: "📈", bg: "#fdf4ff" },
            { to: "/categories-suppliers", label: "Categories",  sub: "& Suppliers",    icon: "🏷️", bg: "#f0fdfa" },
          ].filter(Boolean).map((item) => (
            <Link key={item.to} to={item.to} style={{
              display: "block", padding: "14px", background: item.bg, borderRadius: "10px",
              textDecoration: "none", textAlign: "center",
              border: "1px solid rgba(0,0,0,0.04)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              <div style={{ fontSize: "1.4rem", marginBottom: "6px" }}>{item.icon}</div>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: "700", color: "#111827" }}>{item.label}</p>
              <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#9ca3af" }}>{item.sub}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
