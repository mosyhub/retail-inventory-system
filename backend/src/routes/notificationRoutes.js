// src/routes/notificationRoutes.js
//
// Notification endpoints.

import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.get("/", getNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

export default router;
