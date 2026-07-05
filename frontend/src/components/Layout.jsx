// src/components/Layout.jsx
import React from "react";
import Sidebar from "./Sidebar.jsx";
import Navbar from "./Navbar.jsx";

export default function Layout({ children }) {
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "var(--content-bg)" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {/* Top Navbar */}
        <Navbar />

        {/* Content area */}
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px", background: "var(--content-bg)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
