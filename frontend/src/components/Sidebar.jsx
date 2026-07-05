// src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/* ── SVG icon components ─────────────────────────────────────────────────── */
const Icon = ({ d, d2, viewBox = "0 0 24 24" }) => (
  <svg width="18" height="18" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
    {d2 && <path d={d2} />}
  </svg>
);

const icons = {
  dashboard:  { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", d2: "M9 22V12h6v10" },
  products:   { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" },
  inventory:  { d: "M9 17H5a2 2 0 0 0-2 2v1h14v-1a2 2 0 0 0-2-2h-4z M12 3v10M8 7l4-4 4 4" },
  pos:        { d: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0" },
  sales:      { d: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  predictions:{ d: "M22 12h-4l-3 9L9 3l-3 9H2" },
  reports:    { d: "M18 20V10 M12 20V4 M6 20v-6" },
  auditlogs:  { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", d2: "M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" },
  users:      { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", d2: "M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
  settings:   { d: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" },
};

export default function Sidebar() {
  const { currentUser } = useAuth();
  const location = useLocation();

  const links = [
    { to: "/dashboard",           label: "Dashboard",        icon: "dashboard" },
    { to: "/products",            label: "Products",         icon: "products" },
    { to: "/inventory",           label: "Inventory",        icon: "inventory",   roles: ["inventory_staff", "manager", "admin"] },
    { to: "/pos",                 label: "Point of Sale",    icon: "pos",         roles: ["cashier", "manager", "admin"] },
    { to: "/sales",               label: "Sales",            icon: "sales" },
    { to: "/predictions",         label: "Predictions",      icon: "predictions" },
    { to: "/reports",             label: "Reports",          icon: "reports",     roles: ["manager", "admin"] },
    { to: "/audit-logs",          label: "Audit Logs",       icon: "auditlogs",   roles: ["manager", "admin"] },
    { to: "/users",               label: "Users",            icon: "users",       roles: ["admin"] },
    { to: "/settings",            label: "Settings",         icon: "settings" },
  ];

  const initials = `${currentUser?.firstName?.charAt(0) ?? ""}${currentUser?.lastName?.charAt(0) ?? ""}`;

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        background: "var(--sidebar-bg)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRight: "1px solid var(--sidebar-border)",
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div style={{
        padding: "20px 18px 16px",
        borderBottom: "1px solid var(--sidebar-border)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}>
        <div style={{
          width: "32px", height: "32px",
          background: "#2563eb",
          borderRadius: "8px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: "800", fontSize: "0.8rem", color: "#fff",
          letterSpacing: "-0.03em",
          flexShrink: 0,
        }}>SW</div>
        <div>
          <div style={{ color: "#f9fafb", fontWeight: "700", fontSize: "0.9rem", lineHeight: 1.1 }}>StockWise</div>
          <div style={{ color: "#6b7280", fontSize: "0.68rem", marginTop: "1px" }}>Inventory System</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
        {/* Main section label */}
        <div style={{ padding: "8px 8px 4px", fontSize: "0.65rem", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Main
        </div>

        {links.slice(0, 6).map((link) => {
          if (link.roles && !link.roles.includes(currentUser?.role)) return null;
          const isActive = location.pathname === link.to;
          const ico = icons[link.icon];
          return (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 10px",
                borderRadius: "8px",
                fontSize: "0.845rem",
                fontWeight: isActive ? "600" : "500",
                color: isActive ? "#f9fafb" : "var(--sidebar-text)",
                background: isActive ? "rgba(37,99,235,0.25)" : "transparent",
                textDecoration: "none",
                transition: "all 0.13s ease",
                position: "relative",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--sidebar-hover-bg)"; e.currentTarget.style.color = "#e5e7eb"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sidebar-text)"; }}
            >
              {isActive && (
                <span style={{
                  position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                  width: "3px", height: "20px", background: "#2563eb", borderRadius: "0 3px 3px 0",
                }} />
              )}
              <span style={{ color: isActive ? "#93c5fd" : "var(--sidebar-text)", display: "flex" }}>
                <Icon {...ico} />
              </span>
              <span>{link.label}</span>
            </Link>
          );
        })}

        {/* Management section */}
        <div style={{ padding: "12px 8px 4px", fontSize: "0.65rem", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Management
        </div>

        {links.slice(6).map((link) => {
          if (link.roles && !link.roles.includes(currentUser?.role)) return null;
          const isActive = location.pathname === link.to;
          const ico = icons[link.icon];
          return (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 10px",
                borderRadius: "8px",
                fontSize: "0.845rem",
                fontWeight: isActive ? "600" : "500",
                color: isActive ? "#f9fafb" : "var(--sidebar-text)",
                background: isActive ? "rgba(37,99,235,0.25)" : "transparent",
                textDecoration: "none",
                transition: "all 0.13s ease",
                position: "relative",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--sidebar-hover-bg)"; e.currentTarget.style.color = "#e5e7eb"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sidebar-text)"; }}
            >
              {isActive && (
                <span style={{
                  position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                  width: "3px", height: "20px", background: "#2563eb", borderRadius: "0 3px 3px 0",
                }} />
              )}
              <span style={{ color: isActive ? "#93c5fd" : "var(--sidebar-text)", display: "flex" }}>
                <Icon {...ico} />
              </span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User strip */}
      <div style={{
        padding: "12px 14px",
        borderTop: "1px solid var(--sidebar-border)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}>
        <div style={{
          width: "30px", height: "30px",
          background: "#1d4ed8",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: "700", fontSize: "0.72rem", color: "#fff",
          flexShrink: 0,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#e5e7eb", fontSize: "0.78rem", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {currentUser?.firstName} {currentUser?.lastName}
          </div>
          <div style={{ color: "#6b7280", fontSize: "0.68rem", textTransform: "capitalize" }}>
            {currentUser?.role?.replace("_", " ")}
          </div>
        </div>
      </div>
    </aside>
  );
}
