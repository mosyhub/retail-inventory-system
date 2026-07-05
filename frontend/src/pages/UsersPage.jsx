// src/pages/UsersPage.jsx
//
// Module 2: User Management
// Admin-only page for managing user accounts, roles, and status.

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

const roleBadge = (role) => {
  switch (role) {
    case "admin":          return "badge badge-red";
    case "manager":        return "badge badge-purple";
    case "cashier":        return "badge badge-green";
    case "inventory_staff":return "badge badge-blue";
    default:               return "badge badge-gray";
  }
};

export default function UsersPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "", password: "", firstName: "", lastName: "", role: "cashier",
  });

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users", {
        params: {
          search: searchTerm || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
        },
      });
      setUsers(res.data.users);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      setError("All fields are required to create a user");
      return;
    }
    try {
      setCreateLoading(true);
      await api.post("/users", newUser);
      setSuccess("New employee user created successfully!");
      setNewUser({ email: "", password: "", firstName: "", lastName: "", role: "cashier" });
      setShowCreateModal(false);
      loadUsers();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message || "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      setSuccess("User role updated successfully!");
      loadUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.message || "Failed to update role"); }
  };

  const handleToggleActive = async (userId, isActive) => {
    const action = isActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await api.patch(`/users/${userId}/${action}`);
      setSuccess(`User ${action}d successfully!`);
      loadUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.message || `Failed to ${action} user`); }
  };

  const activeCount   = users.filter(u => u.isActive).length;
  const adminCount    = users.filter(u => u.role === "admin").length;
  const inactiveCount = users.filter(u => !u.isActive).length;

  const lbl = { display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#374151", marginBottom: "5px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: "800", color: "#111827" }}>Users</h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "#9ca3af" }}>Manage user accounts, roles, and access</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create User
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        {[
          { label: "Total Users",  val: users.length,  color: "#111827", bg: "#f3f4f6", accent: "#6b7280" },
          { label: "Active",       val: activeCount,   color: "#16a34a", bg: "#f0fdf4", accent: "#16a34a" },
          { label: "Admins",       val: adminCount,    color: "#dc2626", bg: "#fef2f2", accent: "#dc2626" },
          { label: "Inactive",     val: inactiveCount, color: "#6b7280", bg: "#f9fafb", accent: "#6b7280" },
        ].map(({ label, val, color, bg, accent }) => (
          <div key={label} className="card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
              <p style={{ margin: "6px 0 0", fontSize: "1.75rem", fontWeight: "800", color }}>{val}</p>
            </div>
            <div style={{ background: bg, padding: "10px", borderRadius: "10px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
        ))}
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

      {/* Filter Bar */}
      <div className="card" style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: "32px" }}
            />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input" style={{ width: "160px" }}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
            <option value="inventory_staff">Inventory Staff</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input" style={{ width: "140px" }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={loadUsers}>Apply</button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af", fontSize: "0.875rem" }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>👥</div>
            <div style={{ fontSize: "0.875rem", fontWeight: "500" }}>No users found</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ opacity: user.isActive ? 1 : 0.55 }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "50%",
                          background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.75rem", fontWeight: "700", color: "#2563eb", flexShrink: 0,
                        }}>
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <span style={{ fontWeight: "600", color: "#111827", fontSize: "0.875rem" }}>
                          {user.firstName} {user.lastName}
                          {user.id === currentUser?.uid && (
                            <span style={{ marginLeft: "6px", fontSize: "0.68rem", color: "#9ca3af", fontWeight: "400" }}>(you)</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: "#6b7280", fontSize: "0.875rem" }}>{user.email}</td>
                    <td>
                      {isAdmin && user.id !== currentUser?.uid ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="input"
                          style={{ width: "auto", fontSize: "0.8rem", padding: "4px 8px" }}
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="cashier">Cashier</option>
                          <option value="inventory_staff">Inventory Staff</option>
                        </select>
                      ) : (
                        <span className={roleBadge(user.role)}>
                          {user.role?.replace("_", " ")}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${user.isActive ? "badge-green" : "badge-red"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ color: "#9ca3af", whiteSpace: "nowrap", fontSize: "0.875rem" }}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                    </td>
                    {isAdmin && (
                      <td>
                        {user.id !== currentUser?.uid && (
                          <button
                            onClick={() => handleToggleActive(user.id, user.isActive)}
                            className="btn btn-xs"
                            style={{
                              background: user.isActive ? "#fef2f2" : "#f0fdf4",
                              color: user.isActive ? "#dc2626" : "#16a34a",
                              border: `1px solid ${user.isActive ? "#fecaca" : "#bbf7d0"}`,
                            }}
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div className="modal-box" style={{ maxWidth: "460px", maxHeight: "90vh" }}>
            <div className="modal-header">
              <h2 className="modal-title">👤 Create New User</h2>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={lbl}>First Name *</label>
                    <input type="text" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} placeholder="John" className="input" disabled={createLoading} />
                  </div>
                  <div>
                    <label style={lbl}>Last Name *</label>
                    <input type="text" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} placeholder="Doe" className="input" disabled={createLoading} />
                  </div>
                </div>

                <div>
                  <label style={lbl}>Email Address *</label>
                  <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@store.com" className="input" disabled={createLoading} />
                </div>

                <div>
                  <label style={lbl}>Password *</label>
                  <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Min 6 characters" className="input" disabled={createLoading} />
                </div>

                <div>
                  <label style={lbl}>System Role *</label>
                  <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="input" disabled={createLoading}>
                    <option value="cashier">Cashier</option>
                    <option value="inventory_staff">Inventory Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                  <button type="submit" disabled={createLoading} className="btn btn-primary" style={{ flex: 1, justifyContent: "center", opacity: createLoading ? 0.6 : 1 }}>
                    {createLoading ? "Creating..." : "Create User"}
                  </button>
                  <button type="button" onClick={() => setShowCreateModal(false)} disabled={createLoading} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
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
