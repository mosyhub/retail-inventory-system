// src/routes/supplierRoutes.js
//
// Supplier management endpoints.

import express from "express";
import {
  createSupplier,
  getSuppliers,
  getSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";
import { verifyToken, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.get("/", getSuppliers);
router.get("/:id", getSupplier);
router.post("/", authorize("manager", "admin"), createSupplier);
router.patch("/:id", authorize("manager", "admin"), updateSupplier);
router.delete("/:id", authorize("admin"), deleteSupplier);

export default router;
