// src/routes/auditLogRoutes.js
//
// Audit log endpoints. Read-only access for managers and admins.

import express from "express";
import { getAuditLogs, getAuditLog } from "../controllers/auditLogController.js";
import { authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require manager or admin role
router.use(authorize("manager", "admin"));

router.get("/", getAuditLogs);
router.get("/:id", getAuditLog);

export default router;
