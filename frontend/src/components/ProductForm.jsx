// src/components/ProductForm.jsx
//
// Reusable form for creating and editing products.
// Handles validation and submission.
// Handles validation, submission, and displays all product spec fields.

import React, { useState, useEffect } from "react";
import api from "../services/api.js";

export default function ProductForm({ product, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    category: "",
    price: "",
    cost: "",
    stock: "",
    minimumStock: "",
    safetyStock: "",
    supplierLeadTime: "",
    supplierId: "",
  });

  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await api.get("/suppliers");
      setSuppliers(response.data.suppliers || []);
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    }
  };

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        category: product.category || "",
        price: product.price || "",
        cost: product.cost || "",
        stock: product.stock || "",
        minimumStock: product.minimumStock || "",
        safetyStock: product.safetyStock || "",
        supplierLeadTime: product.supplierLeadTime || "",
        supplierId: product.supplierId || "",
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Product name is required");
      return false;
    }
    if (!formData.sku.trim()) {
      setError("SKU is required");
      return false;
    }
    if (!formData.category.trim()) {
      setError("Category is required");
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError("Price must be greater than 0");
      return false;
    }
    if (formData.stock === "" || parseInt(formData.stock) < 0) {
      setError("Stock must be a valid number");
      return false;
    }
    if (formData.cost && parseFloat(formData.cost) < 0) {
      setError("Cost cannot be negative");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim(),
        sku: formData.sku.trim(),
        category: formData.category.trim(),
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        stock: parseInt(formData.stock),
        minimumStock: formData.minimumStock ? parseInt(formData.minimumStock) : 0,
        safetyStock: formData.safetyStock ? parseInt(formData.safetyStock) : 0,
        supplierLeadTime: formData.supplierLeadTime ? parseInt(formData.supplierLeadTime) : 0,
        supplierId: formData.supplierId,
        reorderLevel: (formData.minimumStock ? parseInt(formData.minimumStock) : 0) + (formData.safetyStock ? parseInt(formData.safetyStock) : 0),
      });
    } catch (err) {
      setError(err.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const lbl = { display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#374151", marginBottom: "5px" };
  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" };
  const grid3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Product Name */}
      <div>
        <label style={lbl}>Product Name *</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Wireless Mouse" className="input" disabled={loading} />
      </div>

      {/* SKU & Barcode */}
      <div style={grid2}>
        <div>
          <label style={lbl}>SKU *</label>
          <input type="text" name="sku" value={formData.sku} onChange={handleChange} placeholder="e.g., SKU-001" className="input" disabled={loading || !!product} />
        </div>
        <div>
          <label style={lbl}>Barcode</label>
          <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} placeholder="e.g., 480123456789" className="input" disabled={loading} />
        </div>
      </div>

      {/* Category */}
      <div>
        <label style={lbl}>Category *</label>
        <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="e.g., Electronics" className="input" disabled={loading} />
      </div>

      {/* Description */}
      <div>
        <label style={lbl}>Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Product description..." rows="2" className="input" disabled={loading} style={{ resize: "none" }} />
      </div>

      {/* Price and Cost */}
      <div style={grid2}>
        <div>
          <label style={lbl}>Price (₱) *</label>
          <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" step="0.01" min="0" className="input" disabled={loading} />
        </div>
        <div>
          <label style={lbl}>Cost (₱)</label>
          <input type="number" name="cost" value={formData.cost} onChange={handleChange} placeholder="0.00" step="0.01" min="0" className="input" disabled={loading} />
        </div>
      </div>

      {/* Stock fields */}
      <div style={grid3}>
        <div>
          <label style={{ ...lbl, fontSize: "0.72rem" }}>Stock *</label>
          <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="0" min="0" className="input" disabled={loading} />
        </div>
        <div>
          <label style={{ ...lbl, fontSize: "0.72rem" }}>Min Stock</label>
          <input type="number" name="minimumStock" value={formData.minimumStock} onChange={handleChange} placeholder="0" min="0" className="input" disabled={loading} />
        </div>
        <div>
          <label style={{ ...lbl, fontSize: "0.72rem" }}>Safety Stock</label>
          <input type="number" name="safetyStock" value={formData.safetyStock} onChange={handleChange} placeholder="0" min="0" className="input" disabled={loading} />
        </div>
      </div>

      {/* Supplier & Lead Time */}
      <div style={grid2}>
        <div>
          <label style={lbl}>Supplier</label>
          <select name="supplierId" value={formData.supplierId} onChange={handleChange} className="input" disabled={loading}>
            <option value="">Select Supplier</option>
            {suppliers.map((sup) => (
              <option key={sup.id} value={sup.id}>{sup.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={lbl}>Lead Time (days)</label>
          <input type="number" name="supplierLeadTime" value={formData.supplierLeadTime} onChange={handleChange} placeholder="e.g., 7" min="0" className="input" disabled={loading} />
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
        <button type="submit" disabled={loading} className={`btn ${loading ? "" : "btn-primary"}`}
          style={{ flex: 1, justifyContent: "center", background: loading ? "#9ca3af" : undefined, cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Saving..." : product ? "Update Product" : "Add Product"}
        </button>
        <button type="button" onClick={onCancel} disabled={loading} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
