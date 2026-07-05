// src/routes/inventoryRoutes.js
//
// Inventory transaction management: stock in/out, adjustments, history.

import express from "express";
import {
  stockIn,
  stockOut,
  adjustStock,
  getTransactions,
  getLowStockProducts,
} from "../controllers/inventoryController.js";
import { verifyToken, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes
router.use(verifyToken);

/**
 * POST /api/inventory/stock-in
 * Add stock to a product
 * Authorization: inventory_staff, manager, admin
 */
router.post("/stock-in", authorize("inventory_staff", "manager", "admin"), stockIn);

/**
 * POST /api/inventory/stock-out
 * Remove stock from a product
 * Authorization: inventory_staff, manager, admin
 */
router.post("/stock-out", authorize("inventory_staff", "manager", "admin"), stockOut);

/**
 * POST /api/inventory/adjust
 * Adjust stock to a specific level
 * Authorization: manager, admin
 */
router.patch("/adjust", authorize("manager", "admin"), adjustStock);

/**
 * GET /api/inventory/transactions
 * Get transaction history
 * Authorization: all authenticated users
 */
router.get("/transactions", getTransactions);

/**
 * GET /api/inventory/low-stock
 * Get low stock products
 * Authorization: all authenticated users
 */
router.get("/low-stock", getLowStockProducts);

export default router;
