// src/pages/CategoriesSupplierPage.jsx
//
// Module 4: Category & Supplier Management
// Tabbed interface for managing product categories and suppliers.

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

export default function CategoriesSupplierPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("categories");

  // Categories state
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);

  // Suppliers state
  const [suppliers, setSuppliers] = useState([]);
  const [supLoading, setSupLoading] = useState(true);

  // Shared state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const canEdit = ["manager", "admin"].includes(currentUser?.role);
  const canDelete = currentUser?.role === "admin";

  useEffect(() => {
    loadCategories();
    loadSuppliers();
  }, []);

  // --- Categories ---
  const loadCategories = async () => {
    try {
      setCatLoading(true);
      const response = await api.get("/categories");
      setCategories(response.data.categories);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setCatLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    try {
      if (editingItem) {
        await api.patch(`/categories/${editingItem.id}`, formData);
        setSuccess("Category updated successfully!");
      } else {
        await api.post("/categories", formData);
        setSuccess("Category created successfully!");
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({});
      loadCategories();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to save category");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await api.delete(`/categories/${id}`);
      setSuccess("Category deleted successfully!");
      loadCategories();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete category");
    }
  };

  // --- Suppliers ---
  const loadSuppliers = async () => {
    try {
      setSupLoading(true);
      const response = await api.get("/suppliers");
      setSuppliers(response.data.suppliers);
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    } finally {
      setSupLoading(false);
    }
  };

  const handleSaveSupplier = async () => {
    try {
      if (editingItem) {
        await api.patch(`/suppliers/${editingItem.id}`, formData);
        setSuccess("Supplier updated successfully!");
      } else {
        await api.post("/suppliers", formData);
        setSuccess("Supplier created successfully!");
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({});
      loadSuppliers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to save supplier");
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await api.delete(`/suppliers/${id}`);
      setSuccess("Supplier deleted successfully!");
      loadSuppliers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete supplier");
    }
  };

  // --- Modal helpers ---
  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(activeTab === "categories" ? { name: "", description: "" } : { name: "", contactPerson: "", email: "", phone: "", address: "" });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData(activeTab === "categories"
      ? { name: item.name, description: item.description || "" }
      : { name: item.name, contactPerson: item.contactPerson || "", email: item.email || "", phone: item.phone || "", address: item.address || "" }
    );
    setShowModal(true);
  };

  const handleSave = () => {
    if (activeTab === "categories") {
      handleSaveCategory();
    } else {
      handleSaveSupplier();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Categories & Suppliers</h1>
            <p className="text-gray-600 mt-1">Manage product categories and supplier information</p>
          </div>
          {canEdit && (
            <button
              onClick={openCreateModal}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              + Add {activeTab === "categories" ? "Category" : "Supplier"}
            </button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={() => setError("")} className="text-red-600 hover:text-red-800 text-sm mt-1">Dismiss</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === "categories"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === "suppliers"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Suppliers ({suppliers.length})
          </button>
        </div>

        {/* Categories Table */}
        {activeTab === "categories" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {catLoading ? (
              <div className="p-8 text-center text-gray-500">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No categories found. Create one to get started.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Created</th>
                      {(canEdit || canDelete) && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{cat.description || "—"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        {(canEdit || canDelete) && (
                          <td className="px-6 py-4 text-sm space-x-2">
                            {canEdit && (
                              <button onClick={() => openEditModal(cat)} className="text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                            )}
                            {canDelete && (
                              <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-600 hover:text-red-700 font-medium">Delete</button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Suppliers Table */}
        {activeTab === "suppliers" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {supLoading ? (
              <div className="p-8 text-center text-gray-500">Loading suppliers...</div>
            ) : suppliers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No suppliers found. Create one to get started.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Address</th>
                      {(canEdit || canDelete) && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {suppliers.map((sup) => (
                      <tr key={sup.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{sup.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{sup.contactPerson || "—"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{sup.email || "—"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{sup.phone || "—"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{sup.address || "—"}</td>
                        {(canEdit || canDelete) && (
                          <td className="px-6 py-4 text-sm space-x-2">
                            {canEdit && (
                              <button onClick={() => openEditModal(sup)} className="text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                            )}
                            {canDelete && (
                              <button onClick={() => handleDeleteSupplier(sup.id)} className="text-red-600 hover:text-red-700 font-medium">Delete</button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? "Edit" : "Add"} {activeTab === "categories" ? "Category" : "Supplier"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {activeTab === "categories" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      rows={3}
                    />
                  </div>
                )}

                {activeTab === "suppliers" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                      <input
                        type="text"
                        value={formData.contactPerson || ""}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        value={formData.address || ""}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        rows={2}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {editingItem ? "Update" : "Create"}
                </button>
                <button
                  onClick={() => { setShowModal(false); setEditingItem(null); }}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
