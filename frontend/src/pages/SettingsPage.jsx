// src/pages/SettingsPage.jsx
//
// Module 13: Settings & System Configuration
// Admin-only page for configuring system settings.

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState({
    storeName: "",
    currencySymbol: "₱",
    taxRate: 0,
    lowStockThreshold: 10,
    receiptFooter: "",
    dateFormat: "MM/DD/YYYY",
    timezone: "Asia/Manila",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/settings");
      setSettings(response.data.settings);
    } catch (err) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      const response = await api.patch("/settings", settings);
      setSettings(response.data.settings);
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure your store and system preferences</p>
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

        <div className="space-y-6">
          {/* Store Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Store Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => handleChange("storeName", e.target.value)}
                  disabled={!isAdmin}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={settings.currencySymbol}
                    onChange={(e) => handleChange("currencySymbol", e.target.value)}
                    disabled={!isAdmin}
                    maxLength={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => handleChange("taxRate", parseFloat(e.target.value) || 0)}
                    disabled={!isAdmin}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Inventory Settings</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Low Stock Threshold</label>
              <input
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) => handleChange("lowStockThreshold", parseInt(e.target.value) || 0)}
                disabled={!isAdmin}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Products with stock at or below this level will trigger low-stock alerts.
              </p>
            </div>
          </div>

          {/* Receipt Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Receipt Settings</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer Text</label>
              <textarea
                value={settings.receiptFooter}
                onChange={(e) => handleChange("receiptFooter", e.target.value)}
                disabled={!isAdmin}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                placeholder="Thank you for your purchase!"
              />
            </div>
          </div>

          {/* Regional Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Regional Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => handleChange("dateFormat", e.target.value)}
                  disabled={!isAdmin}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleChange("timezone", e.target.value)}
                  disabled={!isAdmin}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                >
                  <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                  <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                  <option value="Europe/London">Europe/London (UTC+0)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          {isAdmin && (
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          )}

          {!isAdmin && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-800 text-sm">
                Only administrators can modify system settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
