// src/controllers/settingsController.js
//
// Handles system configuration settings.
// Settings are stored in a single Firestore document: settings/system

import { body, validationResult } from "express-validator";
import { db } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logAction } from "../utils/auditService.js";

// Default settings values
const DEFAULT_SETTINGS = {
  storeName: "Retail Inventory System",
  currencySymbol: "₱",
  taxRate: 0,
  lowStockThreshold: 10,
  receiptFooter: "Thank you for your purchase!",
  dateFormat: "MM/DD/YYYY",
  timezone: "Asia/Manila",
};

/**
 * GET /api/settings
 * Get system settings
 * Protected: all authenticated
 *
 * Response: { success, settings }
 */
export const getSettings = asyncHandler(async (req, res) => {
  try {
    const doc = await db.collection("settings").doc("system").get();

    if (!doc.exists) {
      // Return defaults if no settings have been saved yet
      return res.status(200).json({
        success: true,
        settings: DEFAULT_SETTINGS,
      });
    }

    // Merge with defaults to ensure all keys exist
    const settings = { ...DEFAULT_SETTINGS, ...doc.data() };

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (err) {
    throw err;
  }
});

/**
 * PATCH /api/settings
 * Update system settings (partial update)
 * Protected: admin only
 *
 * Request body: Any of the settings fields
 *
 * Response: { success, message, settings }
 */
export const updateSettings = asyncHandler(async (req, res) => {
  await body("storeName").optional().trim().isLength({ min: 1 }).run(req);
  await body("currencySymbol").optional().trim().isLength({ min: 1, max: 5 }).run(req);
  await body("taxRate").optional().isFloat({ min: 0, max: 100 }).run(req);
  await body("lowStockThreshold").optional().isInt({ min: 0 }).run(req);
  await body("receiptFooter").optional().trim().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const uid = req.user.uid;

  try {
    const updates = {};

    if (req.body.storeName !== undefined) updates.storeName = req.body.storeName;
    if (req.body.currencySymbol !== undefined) updates.currencySymbol = req.body.currencySymbol;
    if (req.body.taxRate !== undefined) updates.taxRate = parseFloat(req.body.taxRate);
    if (req.body.lowStockThreshold !== undefined)
      updates.lowStockThreshold = parseInt(req.body.lowStockThreshold);
    if (req.body.receiptFooter !== undefined) updates.receiptFooter = req.body.receiptFooter;
    if (req.body.dateFormat !== undefined) updates.dateFormat = req.body.dateFormat;
    if (req.body.timezone !== undefined) updates.timezone = req.body.timezone;

    updates.updatedAt = new Date().toISOString();
    updates.updatedBy = uid;

    // Upsert: set with merge so the document is created if it doesn't exist
    await db.collection("settings").doc("system").set(updates, { merge: true });

    // Fetch the complete settings
    const doc = await db.collection("settings").doc("system").get();
    const settings = { ...DEFAULT_SETTINGS, ...doc.data() };

    // Audit log
    await logAction({
      userId: uid,
      action: "update_settings",
      resourceType: "settings",
      resourceId: "system",
      details: updates,
    });

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings,
    });
  } catch (err) {
    throw err;
  }
});
