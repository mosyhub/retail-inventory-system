// src/pages/ProductsPage.jsx
//
// Module 3: Product Management
// Display products table, search, filter by category, create/edit/delete products.

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import ProductForm from "../components/ProductForm.jsx";

export default function ProductsPage() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);

  const canEdit = ["manager", "admin"].includes(currentUser?.role);
  const canDelete = currentUser?.role === "admin";

  useEffect(() => { loadProducts(); loadCategories(); }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products", { params: { search: searchTerm, category: categoryFilter, lowStock: showLowStock } });
      setProducts(res.data.products);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get("/products/categories/all");
      setCategories(res.data.categories);
    } catch (err) { console.error("Failed to load categories:", err); }
  };

  const handleCreateProduct = async (data) => {
    try {
      await api.post("/products", data);
      setSuccess("Product created successfully!");
      setShowForm(false);
      loadProducts(); loadCategories();
    } catch (err) { setError(err.message || "Failed to create product"); }
  };

  const handleUpdateProduct = async (data) => {
    try {
      await api.patch(`/products/${editingProduct.id}`, data);
      setSuccess("Product updated successfully!");
      setEditingProduct(null); setShowForm(false);
      loadProducts();
    } catch (err) { setError(err.message || "Failed to update product"); }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/products/${productId}`);
      setSuccess("Product deleted successfully!");
      loadProducts();
    } catch (err) { setError(err.message || "Failed to delete product"); }
  };

  const handleEdit = (product) => { setEditingProduct(product); setShowForm(true); };
  const handleCloseForm = () => { setShowForm(false); setEditingProduct(null); };

  const lowStockCount = products.filter(p => p.stock <= p.reorderLevel && p.reorderLevel > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: "800", color: "#111827" }}>Products</h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "#9ca3af" }}>Manage your product catalog</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Product
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
        <div className="card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Products</p>
            <p style={{ margin: "6px 0 0", fontSize: "1.75rem", fontWeight: "800", color: "#111827" }}>{products.length}</p>
          </div>
          <div style={{ background: "#eff6ff", padding: "10px", borderRadius: "10px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
        </div>
        <div className="card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Low Stock</p>
            <p style={{ margin: "6px 0 0", fontSize: "1.75rem", fontWeight: "800", color: "#d97706" }}>{lowStockCount}</p>
          </div>
          <div style={{ background: "#fffbeb", padding: "10px", borderRadius: "10px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
        </div>
        <div className="card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Out of Stock</p>
            <p style={{ margin: "6px 0 0", fontSize: "1.75rem", fontWeight: "800", color: "#dc2626" }}>{outOfStockCount}</p>
          </div>
          <div style={{ background: "#fef2f2", padding: "10px", borderRadius: "10px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, fontSize: "1rem" }}>✕</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span style={{ flex: 1 }}>{success}</span>
          <button onClick={() => setSuccess("")} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, fontSize: "1rem" }}>✕</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card" style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: "32px" }}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input"
            style={{ width: "180px" }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <label style={{
            display: "flex", alignItems: "center", gap: "7px",
            padding: "7px 12px", border: "1px solid #d1d5db", borderRadius: "8px",
            cursor: "pointer", fontSize: "0.875rem", color: "#374151", fontWeight: "500",
            background: showLowStock ? "#fffbeb" : "#fff",
            borderColor: showLowStock ? "#fde68a" : "#d1d5db",
            whiteSpace: "nowrap",
          }}>
            <input type="checkbox" checked={showLowStock} onChange={(e) => setShowLowStock(e.target.checked)} style={{ accentColor: "#d97706" }} />
            Low Stock Only
          </label>

          <button className="btn btn-primary btn-sm" onClick={loadProducts}>
            Apply
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>
            <div style={{ fontSize: "0.875rem" }}>Loading products...</div>
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📦</div>
            <div style={{ fontSize: "0.875rem", fontWeight: "500" }}>No products found</div>
            <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>Try adjusting your filters</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  {(canEdit || canDelete) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isLow = product.stock <= product.reorderLevel && product.reorderLevel > 0;
                  const isOut = product.stock === 0;
                  return (
                    <tr key={product.id}>
                      <td>
                        <div style={{ fontWeight: "600", color: "#111827", fontSize: "0.875rem" }}>{product.name}</div>
                        {product.description && <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "2px" }}>{product.description.slice(0, 40)}{product.description.length > 40 ? "…" : ""}</div>}
                      </td>
                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: "0.8rem", background: "#f3f4f6", padding: "2px 7px", borderRadius: "4px", color: "#374151" }}>
                          {product.sku}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-gray">{product.category}</span>
                      </td>
                      <td style={{ fontWeight: "700", color: "#111827" }}>₱{Number(product.price).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${isOut ? "badge-red" : isLow ? "badge-orange" : "badge-green"}`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-blue">Active</span>
                      </td>
                      {(canEdit || canDelete) && (
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {canEdit && (
                              <button className="btn btn-ghost btn-xs" onClick={() => handleEdit(product)}>
                                Edit
                              </button>
                            )}
                            {canDelete && (
                              <button className="btn btn-xs" onClick={() => handleDeleteProduct(product.id)}
                                style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#fef2f2"; }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) handleCloseForm(); }}>
          <div className="modal-box" style={{ maxWidth: "520px", maxHeight: "90vh" }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingProduct ? "✏️ Edit Product" : "➕ Add New Product"}
              </h2>
              <button className="modal-close-btn" onClick={handleCloseForm}>✕</button>
            </div>
            <div className="modal-body">
              <ProductForm
                product={editingProduct}
                onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
                onCancel={handleCloseForm}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
