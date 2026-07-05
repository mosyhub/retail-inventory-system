// src/pages/AuditLogsPage.jsx
//
// Module 12: Audit Logs & Activity History
// View and filter system audit logs. Manager/admin only.

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

export default function AuditLogsPage() {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resourceType = resourceFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get("/audit-logs", { params });
      setLogs(response.data.logs);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.includes("create") || action === "signup") return "bg-green-100 text-green-800";
    if (action.includes("delete") || action.includes("deactivate")) return "bg-red-100 text-red-800";
    if (action.includes("update") || action.includes("activate")) return "bg-blue-100 text-blue-800";
    if (action === "login") return "bg-purple-100 text-purple-800";
    if (action === "logout") return "bg-gray-100 text-gray-800";
    if (action.includes("stock")) return "bg-yellow-100 text-yellow-800";
    if (action.includes("order")) return "bg-indigo-100 text-indigo-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatAction = (action) => {
    return action
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Track all system actions and activity history</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="signup">Signup</option>
              <option value="create_product">Create Product</option>
              <option value="update_product">Update Product</option>
              <option value="delete_product">Delete Product</option>
              <option value="stock_in">Stock In</option>
              <option value="stock_out">Stock Out</option>
              <option value="stock_adjust">Stock Adjust</option>
              <option value="create_order">Create Order</option>
              <option value="update_user_role">Update Role</option>
              <option value="create_supplier">Create Supplier</option>
              <option value="create_category">Create Category</option>
              <option value="update_settings">Update Settings</option>
            </select>

            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">All Resources</option>
              <option value="user">User</option>
              <option value="product">Product</option>
              <option value="inventory">Inventory</option>
              <option value="sale">Sale</option>
              <option value="supplier">Supplier</option>
              <option value="category">Category</option>
              <option value="settings">Settings</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="Start Date"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="End Date"
            />

            <button
              onClick={loadLogs}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No audit logs found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Resource</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {log.timestamp
                          ? new Date(log.timestamp).toLocaleString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.userName || log.userId || "System"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="capitalize">{log.resourceType}</span>
                        {log.resourceId && (
                          <span className="text-xs text-gray-400 ml-1">({log.resourceId.slice(0, 8)}...)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {log.details && Object.keys(log.details).length > 0
                          ? JSON.stringify(log.details).slice(0, 100)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Count */}
        <p className="text-sm text-gray-500 mt-4">
          Showing {logs.length} log entries
        </p>
      </div>
    </div>
  );
}
