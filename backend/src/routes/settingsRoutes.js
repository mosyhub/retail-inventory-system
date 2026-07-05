// src/routes/settingsRoutes.js
//
// System settings endpoints.

import express from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { verifyToken, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.get("/", getSettings);
router.patch("/", authorize("admin"), updateSettings);

export default router;
