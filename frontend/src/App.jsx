// src/App.jsx
//
// Root component: defines all top-level routes.
// AuthProvider wraps the entire app to enable auth context access in any component.

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";

// Pages
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import StockInPage from "./pages/StockInPage.jsx";
import StockOutPage from "./pages/StockOutPage.jsx";
import POSPage from "./pages/POSPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import CategoriesSupplierPage from "./pages/CategoriesSupplierPage.jsx";
import PredictionsPage from "./pages/PredictionsPage.jsx";
import AuditLogsPage from "./pages/AuditLogsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import SalesPage from "./pages/SalesPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes wrapped in Layout */}
          <Route
            path="/dashboard"
            element={<ProtectedRoute element={<Layout><DashboardPage /></Layout>} />}
          />
          <Route
            path="/products"
            element={<ProtectedRoute element={<Layout><ProductsPage /></Layout>} />}
          />
          <Route
            path="/inventory"
            element={<ProtectedRoute element={<Layout><InventoryPage /></Layout>} />}
          />
          <Route
            path="/stock-in"
            element={<ProtectedRoute element={<Layout><StockInPage /></Layout>} requiredRoles={["inventory_staff", "manager", "admin"]} />}
          />
          <Route
            path="/stock-out"
            element={<ProtectedRoute element={<Layout><StockOutPage /></Layout>} requiredRoles={["inventory_staff", "manager", "admin"]} />}
          />
          <Route
            path="/pos"
            element={<ProtectedRoute element={<Layout><POSPage /></Layout>} requiredRoles={["cashier", "manager", "admin"]} />}
          />
          <Route
            path="/reports"
            element={<ProtectedRoute element={<Layout><ReportsPage /></Layout>} requiredRoles={["manager", "admin"]} />}
          />
          <Route
            path="/users"
            element={<ProtectedRoute element={<Layout><UsersPage /></Layout>} requiredRoles={["admin"]} />}
          />
          <Route
            path="/categories-suppliers"
            element={<ProtectedRoute element={<Layout><CategoriesSupplierPage /></Layout>} />}
          />
          <Route
            path="/predictions"
            element={<ProtectedRoute element={<Layout><PredictionsPage /></Layout>} />}
          />
          <Route
            path="/sales"
            element={<ProtectedRoute element={<Layout><SalesPage /></Layout>} />}
          />
          <Route
            path="/audit-logs"
            element={<ProtectedRoute element={<Layout><AuditLogsPage /></Layout>} requiredRoles={["manager", "admin"]} />}
          />
          <Route
            path="/settings"
            element={<ProtectedRoute element={<Layout><SettingsPage /></Layout>} />}
          />
          <Route
            path="/profile"
            element={<ProtectedRoute element={<Layout><ProfilePage /></Layout>} />}
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Catch-all: redirect unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
