// src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";

const pageTitles = {
  "/dashboard":           { title: "Dashboard",        subtitle: "Overview of your store" },
  "/products":            { title: "Products",          subtitle: "Manage your product catalog" },
  "/inventory":           { title: "Inventory",         subtitle: "Stock movements & history" },
  "/stock-in":            { title: "Stock In",          subtitle: "Add inventory to stock" },
  "/stock-out":           { title: "Stock Out",         subtitle: "Remove inventory from stock" },
  "/pos":                 { title: "Point of Sale",     subtitle: "Process customer transactions" },
  "/sales":               { title: "Sales",             subtitle: "View all sales records" },
  "/predictions":         { title: "Predictions",       subtitle: "AI-powered stock forecasting" },
  "/reports":             { title: "Reports",           subtitle: "Analytics & performance" },
  "/audit-logs":          { title: "Audit Logs",        subtitle: "System activity trail" },
  "/users":               { title: "Users",             subtitle: "Manage team accounts" },
  "/settings":            { title: "Settings",          subtitle: "App configuration" },
  "/profile":             { title: "Profile",           subtitle: "Your account details" },
  "/categories-suppliers":{ title: "Categories & Suppliers", subtitle: "Manage categories and suppliers" },
};

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const page = pageTitles[location.pathname] || { title: "StockWise", subtitle: "" };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const initials = `${currentUser?.firstName?.charAt(0) ?? ""}${currentUser?.lastName?.charAt(0) ?? ""}`;

  return (
    <header style={{
      height: "var(--topbar-h)",
      background: "var(--topbar-bg)",
      borderBottom: "1px solid var(--topbar-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      zIndex: 40,
    }}>
      {/* Left: Page title */}
      <div>
        <h1 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#111827", lineHeight: 1.2, margin: 0 }}>
          {page.title}
        </h1>
        {page.subtitle && (
          <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0, marginTop: "1px" }}>
            {page.subtitle}
          </p>
        )}
      </div>

      {/* Right: actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Search bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#f3f4f6",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "6px 12px",
          width: "200px",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Search...</span>
        </div>

        {/* Notification Bell */}
        <NotificationBell />

        {/* Divider */}
        <div style={{ width: "1px", height: "24px", background: "#e5e7eb" }} />

        {/* User */}
        <Link
          to="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            padding: "4px 6px",
            borderRadius: "8px",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <div style={{
            width: "32px", height: "32px",
            background: "#2563eb",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "700", fontSize: "0.75rem", color: "#fff",
            flexShrink: 0,
          }}>{initials}</div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#111827" }}>
              {currentUser?.firstName} {currentUser?.lastName}
            </div>
            <div style={{ fontSize: "0.7rem", color: "#9ca3af", textTransform: "capitalize" }}>
              {currentUser?.role?.replace("_", " ")}
            </div>
          </div>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "34px",
            height: "34px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            background: "transparent",
            color: "#9ca3af",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fecaca"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
