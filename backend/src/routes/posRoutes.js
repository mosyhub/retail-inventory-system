// src/routes/posRoutes.js
//
// Point of Sale endpoints: create orders, view sales history, generate receipts.

import express from "express";
import {
  createOrder,
  getOrders,
  getOrder,
  getSalesSummary,
} from "../controllers/posController.js";
import { verifyToken, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes
router.use(verifyToken);

/**
 * POST /api/pos/orders
 * Create a new sale order
 * Authorization: cashier, manager, admin
 */
router.post("/orders", authorize("cashier", "manager", "admin"), createOrder);

/**
 * GET /api/pos/orders
 * Get sales history
 * Authorization: all authenticated users
 */
router.get("/orders", getOrders);

/**
 * GET /api/pos/orders/:id
 * Get a single order
 * Authorization: all authenticated users
 */
router.get("/orders/:id", getOrder);

/**
 * GET /api/pos/sales-summary
 * Get sales statistics
 * Authorization: manager, admin
 */
router.get("/sales-summary", authorize("manager", "admin"), getSalesSummary);

export default router;
