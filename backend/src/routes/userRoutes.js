// src/routes/userRoutes.js
//
// User management endpoints. Admin-only operations.

import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  updateUserRole,
  deactivateUser,
  activateUser,
} from "../controllers/userController.js";
import { authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require admin role
router.use(authorize("admin"));

router.get("/", getUsers);
router.post("/", createUser);
router.get("/:id", getUser);
router.patch("/:id/role", updateUserRole);
router.patch("/:id/deactivate", deactivateUser);
router.patch("/:id/activate", activateUser);

export default router;
