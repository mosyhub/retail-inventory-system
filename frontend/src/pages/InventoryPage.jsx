// src/pages/InventoryPage.jsx
//
// Module 4: Inventory Management
// Stock in/out operations, transaction history, low stock alerts.

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

export default function InventoryPage() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("stock-in");
  const [formData, setFormData] = useState({ productId: "", quantity: "", reason: "", referenceNo: "", newStock: "" });

  const canEdit = ["inventory_staff", "manager", "admin"].includes(currentUser?.role);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, transactionsRes, lowStockRes] = await Promise.all([
        api.get("/products"),
        api.get("/inventory/transactions?limit=20"),
        api.get("/inventory/low-stock"),
      ]);
      setProducts(productsRes.data.products);
      setTransactions(transactionsRes.data.transactions);
      setLowStockProducts(lowStockRes.data.products);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.productId || !formData.quantity) { setError("Please fill all required fields"); return; }

    try {
      let endpoint = "", data = {};
      if (formType === "stock-in") {
        endpoint = "/inventory/stock-in";
        data = { productId: formData.productId, quantity: parseInt(formData.quantity), reason: formData.reason, referenceNo: formData.referenceNo };
      } else if (formType === "stock-out") {
        endpoint = "/inventory/stock-out";
        data = { productId: formData.productId, quantity: parseInt(formData.quantity), reason: formData.reason, referenceNo: formData.referenceNo };
      } else {
        endpoint = "/inventory/adjust";
        data = { productId: formData.productId, newStock: parseInt(formData.newStock), reason: formData.reason };
      }

      await api.post(endpoint, data);
      setSuccess(`${formType === "stock-in" ? "Stock In" : formType === "stock-out" ? "Stock Out" : "Adjustment"} recorded successfully!`);
      setShowForm(false);
      setFormData({ productId: "", quantity: "", reason: "", referenceNo: "", newStock: "" });
      loadData();
    } catch (err) {
      setError(err.message || "Failed to process transaction");
    }
  };

  const openForm = (type) => { setFormType(type); setShowForm(true); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: "800", color: "#111827" }}>Inventory</h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "#9ca3af" }}>Track stock movements and transactions</p>
        </div>
        {canEdit && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-success" onClick={() => openForm("stock-in")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Stock In
            </button>
            <button className="btn btn-warning" onClick={() => openForm("stock-out")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Stock Out
            </button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}>✕</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span style={{ flex: 1 }}>{success}</span>
          <button onClick={() => setSuccess("")} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}>✕</button>
        </div>
      )}

      {/* Low Stock Banner */}
      {lowStockProducts.length > 0 && (
        <div style={{
          padding: "14px 18px",
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderLeft: "4px solid #f59e0b",
          borderRadius: "10px",
        }}>
          <p style={{ margin: "0 0 8px", fontWeight: "700", color: "#92400e", fontSize: "0.875rem" }}>
            ⚠️ {lowStockProducts.length} item{lowStockProducts.length !== 1 ? "s" : ""} need restocking
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {lowStockProducts.slice(0, 4).map(p => (
              <span key={p.id} style={{
                background: "#fef3c7", color: "#92400e",
                padding: "3px 10px", borderRadius: "99px",
                fontSize: "0.75rem", fontWeight: "600",
              }}>
                {p.name} ({p.stock} left)
              </span>
            ))}
            {lowStockProducts.length > 4 && (
              <span style={{ fontSize: "0.75rem", color: "#d97706" }}>+{lowStockProducts.length - 4} more</span>
            )}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
        {[
          { label: "Total Products", val: products.length, color: "#2563eb", bg: "#eff6ff" },
          { label: "Low Stock", val: lowStockProducts.length, color: "#d97706", bg: "#fffbeb" },
          { label: "Recent Transactions", val: transactions.length, color: "#16a34a", bg: "#f0fdf4" },
        ].map(({ label, val, color, bg }) => (
          <div key={label} className="card" style={{ padding: "16px 20px" }}>
            <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
            <p style={{ margin: "6px 0 0", fontSize: "1.75rem", fontWeight: "800", color }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "#111827" }}>Recent Transactions</h3>
            <p style={{ margin: "3px 0 0", fontSize: "0.78rem", color: "#9ca3af" }}>Last 20 stock movements</p>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af", fontSize: "0.875rem" }}>Loading...</div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔄</div>
            <div style={{ fontSize: "0.875rem", fontWeight: "500" }}>No transactions yet</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Before</th>
                  <th>After</th>
                  <th>Reason</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td style={{ fontWeight: "600", color: "#111827" }}>{txn.productName}</td>
                    <td>
                      <span className={`badge ${txn.type === "stock_in" ? "badge-green" : txn.type === "stock_out" ? "badge-orange" : "badge-blue"}`}>
                        {txn.type.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ fontWeight: "600", color: txn.type === "stock_in" ? "#16a34a" : "#dc2626" }}>
                      {txn.type === "stock_in" ? "+" : "-"}{txn.quantity}
                    </td>
                    <td style={{ color: "#6b7280" }}>{txn.previousStock}</td>
                    <td style={{ fontWeight: "700", color: "#111827" }}>{txn.newStock}</td>
                    <td style={{ color: "#6b7280", maxWidth: "160px" }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {txn.reason || "—"}
                      </span>
                    </td>
                    <td style={{ color: "#9ca3af", whiteSpace: "nowrap" }}>
                      {new Date(txn.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock In/Out Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal-box" style={{ maxWidth: "480px", maxHeight: "90vh" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.3rem" }}>
                  {formType === "stock-in" ? "📦" : formType === "stock-out" ? "📤" : "⚖️"}
                </span>
                <h2 className="modal-title">
                  {formType === "stock-in" ? "Stock In" : formType === "stock-out" ? "Stock Out" : "Adjust Stock"}
                </h2>
              </div>
              <button className="modal-close-btn" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Product *</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                    ))}
                  </select>
                </div>

                {formType !== "adjust" ? (
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Quantity *</label>
                    <input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder="Enter quantity" className="input" />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>New Stock Level *</label>
                    <input type="number" min="0" value={formData.newStock} onChange={(e) => setFormData({ ...formData, newStock: e.target.value })} placeholder="Enter new stock level" className="input" />
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>
                    {formType === "adjust" ? "Reason *" : "Reason"}
                  </label>
                  <input type="text" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder={formType === "stock-in" ? "e.g., Supplier Delivery" : "e.g., Damage, Loss"} className="input" />
                </div>

                {formType !== "adjust" && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Reference No</label>
                    <input type="text" value={formData.referenceNo} onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })} placeholder="e.g., PO-001" className="input" />
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                  <button type="submit" className={`btn ${formType === "stock-in" ? "btn-success" : formType === "stock-out" ? "btn-warning" : "btn-primary"}`} style={{ flex: 1, justifyContent: "center" }}>
                    {formType === "stock-in" ? "Record Stock In" : formType === "stock-out" ? "Record Stock Out" : "Apply Adjustment"}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ flex: 1, justifyContent: "center" }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
