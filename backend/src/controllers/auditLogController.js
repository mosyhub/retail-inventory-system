// src/controllers/auditLogController.js
//
// Handles audit log retrieval. Logs are written by auditService.js from other controllers.
// This controller only provides read access.

import { db } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * GET /api/audit-logs
 * Get audit logs with filtering
 * Protected: admin, manager
 *
 * Query params:
 *   - action: string (filter by action type)
 *   - userId: string (filter by user)
 *   - resourceType: string (filter by resource type)
 *   - startDate: ISO date
 *   - endDate: ISO date
 *   - limit: number (default: 50)
 *
 * Response: { success, logs, total }
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { action, userId, resourceType, startDate, endDate, limit = 50 } = req.query;

  try {
    let query = db.collection("auditLogs");

    // Apply filters (Firestore allows one inequality filter + orderBy on same field)
    if (userId) {
      query = query.where("userId", "==", userId);
    }

    if (action) {
      query = query.where("action", "==", action);
    }

    if (resourceType) {
      query = query.where("resourceType", "==", resourceType);
    }

    // Date range filtering
    if (startDate) {
      query = query.where("timestamp", ">=", new Date(startDate).toISOString());
    }
    if (endDate) {
      query = query.where("timestamp", "<=", new Date(endDate).toISOString());
    }

    const snapshot = await query
      .orderBy("timestamp", "desc")
      .limit(parseInt(limit))
      .get();

    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/audit-logs/:id
 * Get a single audit log entry
 * Protected: admin, manager
 *
 * Response: { success, log }
 */
export const getAuditLog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection("auditLogs").doc(id).get();

    if (!doc.exists) {
      throw new ApiError(404, "Audit log entry not found");
    }

    res.status(200).json({
      success: true,
      log: { id: doc.id, ...doc.data() },
    });
  } catch (err) {
    throw err;
  }
});
