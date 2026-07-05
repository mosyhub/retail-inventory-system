// src/components/ProtectedRoute.jsx
//
// Wrapper component for routes that require authentication.
// If user is not authenticated, redirects to login.
// If user doesn't have required role, shows unauthorized message.

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * ProtectedRoute Component
 *
 * Props:
 *   - element: The component to render if authorized
 *   - requiredRoles: Array of allowed roles (e.g., ["admin", "manager"])
 *                    If omitted, only checks authentication (any authenticated user allowed)
 *
 * Usage:
 *   <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
 *   <Route path="/admin" element={<ProtectedRoute element={<AdminPanel />} requiredRoles={["admin"]} />} />
 */
const ProtectedRoute = ({ element, requiredRoles = [] }) => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  // Still loading auth state — show loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but role doesn't match — show unauthorized
  if (requiredRoles.length > 0 && !requiredRoles.includes(currentUser?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
          <p className="mt-2 text-gray-600">
            Your role ({currentUser?.role}) does not have permission to access this page.
          </p>
          <p className="mt-2 text-sm text-gray-500">Required roles: {requiredRoles.join(", ")}</p>
        </div>
      </div>
    );
  }

  // Authorized — render the component
  return element;
};

export default ProtectedRoute;
