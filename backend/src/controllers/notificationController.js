// src/controllers/notificationController.js
//
// Handles notification operations: retrieve, mark as read, and create low-stock alerts.
// Notifications are stored in the Firestore `notifications` collection.

import { db } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * GET /api/notifications
 * Get notifications for the current user (or broadcast notifications).
 * Protected: all authenticated
 *
 * Query params:
 *   - limit: number (default: 20)
 *   - unreadOnly: boolean (default: false)
 *
 * Response: { success, notifications, total, unreadCount }
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const uid = req.user.uid;
  const { limit = 20, unreadOnly } = req.query;

  try {
    // Get notifications for this user or broadcast ("all")
    const snapshot = await db
      .collection("notifications")
      .where("userId", "in", [uid, "all"])
      .orderBy("createdAt", "desc")
      .limit(parseInt(limit))
      .get();

    let notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Count unread
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // Filter to unread only if requested
    if (unreadOnly === "true") {
      notifications = notifications.filter((n) => !n.isRead);
    }

    res.status(200).json({
      success: true,
      notifications,
      total: notifications.length,
      unreadCount,
    });
  } catch (err) {
    throw err;
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 * Protected: authenticated
 *
 * Response: { success, message }
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection("notifications").doc(id).get();

    if (!doc.exists) {
      throw new ApiError(404, "Notification not found");
    }

    await db.collection("notifications").doc(id).update({
      isRead: true,
      readAt: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (err) {
    throw err;
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for the current user
 * Protected: authenticated
 *
 * Response: { success, message, count }
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const uid = req.user.uid;

  try {
    const snapshot = await db
      .collection("notifications")
      .where("userId", "in", [uid, "all"])
      .where("isRead", "==", false)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        isRead: true,
        readAt: new Date().toISOString(),
      });
    });

    await batch.commit();

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      count: snapshot.docs.length,
    });
  } catch (err) {
    throw err;
  }
});

/**
 * Internal helper: Create a low-stock notification.
 * Called from inventory and POS controllers when stock drops below reorder level.
 * NOT exposed as an API endpoint.
 *
 * @param {string} productId
 * @param {string} productName
 * @param {number} currentStock
 * @param {number} reorderLevel
 */
export const createLowStockNotification = async (
  productId,
  productName,
  currentStock,
  reorderLevel
) => {
  try {
    // Broadcast to all users (managers/admins will see these)
    await db.collection("notifications").add({
      userId: "all",
      type: "low_stock",
      title: "Low Stock Alert",
      message: `${productName} stock is below minimum threshold (${currentStock} units remaining, reorder level: ${reorderLevel})`,
      severity: currentStock === 0 ? "critical" : "warning",
      relatedResourceId: productId,
      isRead: false,
      createdAt: new Date().toISOString(),
      readAt: null,
    });
  } catch (err) {
    // Notification creation should never crash the main operation
    console.error("Failed to create low stock notification:", err.message);
  }
};
