// src/utils/auditService.js
//
// Reusable audit logging utility.
// Any controller can import logAction() to record an event in the auditLogs collection.

import { db } from "../config/firebase.js";

/**
 * Log an action to the auditLogs Firestore collection.
 *
 * @param {Object} params
 * @param {string} params.userId    - UID of the user who performed the action
 * @param {string} params.userName  - Display name (firstName + lastName)
 * @param {string} params.action    - Action identifier, e.g. "login", "create_product"
 * @param {string} params.resourceType - Type of resource affected, e.g. "user", "product"
 * @param {string} [params.resourceId] - ID of the affected resource (optional)
 * @param {Object} [params.details]    - Additional context (optional)
 * @param {string} [params.ipAddress]  - IP address (optional)
 */
export const logAction = async ({
  userId,
  userName = "System",
  action,
  resourceType,
  resourceId = "",
  details = {},
  ipAddress = "",
}) => {
  try {
    await db.collection("auditLogs").add({
      userId,
      userName,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Audit logging should never crash the main operation.
    // Log the error but do not throw.
    console.error("Audit log write failed:", err.message);
  }
};

export default logAction;
