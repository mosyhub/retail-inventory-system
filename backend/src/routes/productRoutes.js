// src/routes/productRoutes.js
//
// Product management endpoints: CRUD operations.
// All routes are protected and require authentication.

import express from "express";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from "../controllers/productController.js";
import { verifyToken, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes — require authentication
router.use(verifyToken);

/**
 * POST /api/products
 * Create a new product
 * Authorization: manager, admin
 */
router.post("/", authorize("manager", "admin"), createProduct);

/**
 * GET /api/products
 * Get all products (with optional filters)
 * Authorization: all authenticated users
 */
router.get("/", getProducts);

/**
 * GET /api/products/categories/all
 * Get all unique categories
 * Authorization: all authenticated users
 */
router.get("/categories/all", getCategories);

/**
 * GET /api/products/:id
 * Get a single product
 * Authorization: manager, admin
 */
router.get("/:id", authorize("manager", "admin"), getProduct);

/**
 * PATCH /api/products/:id
 * Update a product
 * Authorization: manager, admin
 */
router.patch("/:id", authorize("manager", "admin"), updateProduct);

/**
 * DELETE /api/products/:id
 * Delete a product (soft delete)
 * Authorization: admin only
 */
router.delete("/:id", authorize("admin"), deleteProduct);

export default router;
