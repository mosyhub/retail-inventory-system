// src/pages/PredictionsPage.jsx
//
// Module 10: Predictive Stock Management
// Displays stock forecasts: avg daily sales, days remaining, ROP, recommended quantity, status.

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

export default function PredictionsPage() {
  const { currentUser } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canGenerate = ["manager", "admin"].includes(currentUser?.role);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      const response = await api.get("/predictions");
      setPredictions(response.data.predictions);
      setError("");
    } catch (err) {
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError("");
      const response = await api.post("/predictions/generate");
      setPredictions(response.data.predictions);
      setSuccess(`Predictions generated successfully!`);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message || "Failed to generate predictions");
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Restock Now":
        return "bg-red-100 text-red-800";
      case "Restock Soon":
        return "bg-yellow-100 text-yellow-800";
      case "Sufficient":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Summary stats
  const restockNowCount = predictions.filter((p) => p.status === "Restock Now").length;
  const restockSoonCount = predictions.filter((p) => p.status === "Restock Soon").length;
  const sufficientCount = predictions.filter((p) => p.status === "Sufficient").length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Predictive Stock Management</h1>
            <p className="text-gray-600 mt-1">
              Forecast stockouts and reorder recommendations based on sales history
            </p>
          </div>
          {canGenerate && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 cursor-pointer"
            >
              {generating ? "Generating..." : "🔄 Generate Forecast"}
            </button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Total Products</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{predictions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <p className="text-gray-600 text-sm font-medium">Restock Now</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{restockNowCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm font-medium">Restock Soon</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{restockSoonCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium">Sufficient</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{sufficientCount}</p>
          </div>
        </div>

        {/* Predictions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading predictions...</div>
          ) : predictions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg mb-2">No predictions yet</p>
              <p className="text-sm">Click "Generate Forecast" to analyze your sales data and create stock predictions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Current Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Avg Daily Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Days Remaining</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">ROP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Recommended Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {predictions.map((pred) => (
                    <tr key={pred.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{pred.productName}</p>
                        {pred.sku && <p className="text-xs text-gray-500">{pred.sku}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{pred.currentStock} units</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{pred.averageDailySales}/day</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {pred.daysRemaining >= 999 ? "∞" : `${pred.daysRemaining} days`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{pred.reorderPoint} units</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {pred.recommendedQuantity > 0 ? `${pred.recommendedQuantity} units` : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(pred.status)}`}>
                          {pred.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Last Updated */}
        {predictions.length > 0 && predictions[0].lastUpdated && (
          <p className="text-xs text-gray-500 mt-4 text-right">
            Last updated: {new Date(predictions[0].lastUpdated).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
