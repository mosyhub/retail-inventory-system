// src/routes/reportRoutes.js
//
// Analytics and reporting endpoints.

import express from "express";
import {
  getSalesReport,
  getInventoryReport,
  getTopProducts,
  getDashboardStats,
  getSalesByCategory,
} from "../controllers/reportController.js";
import { verifyToken, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes
router.use(verifyToken);

/**
 * GET /api/reports/dashboard-stats
 * Quick statistics for dashboard
 * Authorization: all authenticated users
 */
router.get("/dashboard-stats", getDashboardStats);

/**
 * GET /api/reports/sales-report
 * Sales report with date range and grouping
 * Authorization: manager, admin
 */
router.get("/sales-report", authorize("manager", "admin"), getSalesReport);

/**
 * GET /api/reports/inventory-report
 * Inventory status and valuation report
 * Authorization: manager, admin
 */
router.get("/inventory-report", authorize("manager", "admin"), getInventoryReport);

/**
 * GET /api/reports/top-products
 * Top selling products
 * Authorization: manager, admin
 */
router.get("/top-products", authorize("manager", "admin"), getTopProducts);

/**
 * GET /api/reports/sales-by-category
 * Sales breakdown by category
 * Authorization: manager, admin
 */
router.get("/sales-by-category", authorize("manager", "admin"), getSalesByCategory);

export default router;
