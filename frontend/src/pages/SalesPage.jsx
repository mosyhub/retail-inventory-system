// src/pages/SalesPage.jsx
//
// Module 8: Sales Management
// Dedicated sales history page with order listing and date filtering.

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

export default function SalesPage() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get("/pos/orders", { params });
      setOrders(response.data.orders);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentBadge = (method) => {
    switch (method) {
      case "cash":
        return "bg-green-100 text-green-800";
      case "card":
        return "bg-blue-100 text-blue-800";
      case "check":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Summary stats
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalItems = orders.reduce(
    (sum, o) => sum + (o.items?.reduce((s, i) => s + i.quantity, 0) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Sales History</h1>
          <p className="text-gray-600 mt-1">View and manage all sales transactions</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Orders</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{orders.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600 mt-2">₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Items Sold</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{totalItems}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={loadOrders}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                Filter
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setStartDate(""); setEndDate(""); loadOrders(); }}
                className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Order #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {order.orderNo || order.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString()
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {order.items?.length || 0} items
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          ₱{(order.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getPaymentBadge(order.paymentMethod)}`}>
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() =>
                              setExpandedOrder(expandedOrder === order.id ? null : order.id)
                            }
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {expandedOrder === order.id ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Order Details */}
                      {expandedOrder === order.id && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700">Order Items:</p>
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="text-xs text-gray-500 uppercase">
                                    <th className="text-left py-1">Product</th>
                                    <th className="text-left py-1">SKU</th>
                                    <th className="text-left py-1">Qty</th>
                                    <th className="text-left py-1">Price</th>
                                    <th className="text-left py-1">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items?.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="py-1 text-gray-800">{item.productName}</td>
                                      <td className="py-1 text-gray-600">{item.sku}</td>
                                      <td className="py-1 text-gray-600">{item.quantity}</td>
                                      <td className="py-1 text-gray-600">₱{item.price?.toFixed(2)}</td>
                                      <td className="py-1 font-medium text-gray-800">₱{item.subtotal?.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {order.notes && (
                                <p className="text-xs text-gray-500 mt-2">Notes: {order.notes}</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
