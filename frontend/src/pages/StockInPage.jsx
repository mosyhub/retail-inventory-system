// src/pages/StockInPage.jsx
import React, { useState, useEffect } from "react";
import api from "../services/api.js";
import BarcodeScanner from "../components/BarcodeScanner.jsx";

export default function StockInPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    reason: "Supplier Delivery",
    referenceNo: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/products");
      setProducts(response.data.products || []);
    } catch (err) {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScan = (barcode) => {
    const product = products.find((p) => p.barcode === barcode || p.sku === barcode);
    if (product) {
      setFormData({ ...formData, productId: product.id });
      setSuccess(`Product "${product.name}" detected!`);
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(`No product found with barcode / SKU matching "${barcode}"`);
      setTimeout(() => setError(""), 4000);
    }
    setShowScanner(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.productId || !formData.quantity) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const data = {
        productId: formData.productId,
        quantity: parseInt(formData.quantity),
        reason: formData.reason,
        referenceNo: formData.referenceNo,
      };

      await api.post("/inventory/stock-in", data);
      setSuccess("Stock added successfully!");
      setFormData({ productId: "", quantity: "", reason: "Supplier Delivery", referenceNo: "" });
      loadProducts();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message || "Failed to stock in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800">Stock In</h1>
        <p className="text-gray-500 mt-1">Add new inventory items to stock count</p>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">{error}</div>}
      {success && <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm font-medium">{success}</div>}

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Log Stock Entry</h2>
          <button
            onClick={() => setShowScanner(!showScanner)}
            className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold cursor-pointer"
          >
            {showScanner ? "Hide Scanner" : "📷 Scan Barcode / SKU"}
          </button>
        </div>

        {showScanner && (
          <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Select Product *</label>
            <select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm"
              disabled={loading}
              required
            >
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (SKU: {p.sku} | Barcode: {p.barcode || "N/A"} | Current: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Reference No</label>
              <input
                type="text"
                value={formData.referenceNo}
                onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                placeholder="e.g. PO-10098"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Reason / Note</label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Supplier Delivery, Customer Return"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition cursor-pointer"
          >
            {loading ? "Recording..." : "Record Stock Entry"}
          </button>
        </form>
      </div>
    </div>
  );
}
