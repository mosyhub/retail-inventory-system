// src/routes/categoryRoutes.js
//
// Category management endpoints.

import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { verifyToken, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.get("/", getCategories);
router.post("/", authorize("manager", "admin"), createCategory);
router.patch("/:id", authorize("manager", "admin"), updateCategory);
router.delete("/:id", authorize("admin"), deleteCategory);

export default router;
