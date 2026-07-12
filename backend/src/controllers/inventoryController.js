// src/controllers/inventoryController.js
//
// Handles inventory transactions: stock in, stock out, adjustments.
// Tracks all inventory changes with audit trail.

import { body, validationResult, param } from "express-validator";
import { db } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logAction } from "../utils/auditService.js";
import { createLowStockNotification } from "./notificationController.js";

/**
 * POST /api/inventory/stock-in
 * Add stock to a product
 * Protected: inventory_staff, manager, admin
 *
 * Request body:
 *   - productId: string (required)
 *   - quantity: number (required, > 0)
 *   - reason: string (optional, e.g., "Supplier Delivery")
 *   - referenceNo: string (optional, e.g., PO number)
 *
 * Response: { success, message, transaction }
 */
export const stockIn = asyncHandler(async (req, res) => {
  await body("productId").trim().notEmpty().run(req);
  await body("quantity").isInt({ min: 1 }).run(req);
  await body("reason").optional().trim().run(req);
  await body("referenceNo").optional().trim().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { productId, quantity, reason, referenceNo } = req.body;
  const uid = req.user.uid;

  try {
    // Get product
    const productDoc = await db.collection("products").doc(productId).get();
    if (!productDoc.exists) {
      throw new ApiError(404, "Product not found");
    }

    const product = productDoc.data();
    const newStock = product.stock + quantity;

    // Update product stock
    await db.collection("products").doc(productId).update({
      stock: newStock,
      updatedAt: new Date().toISOString(),
    });

    // Log transaction
    const transactionRef = await db.collection("inventoryTransactions").add({
      type: "stock_in",
      productId,
      productName: product.name,
      quantity: parseInt(quantity),
      previousStock: product.stock,
      newStock,
      reason: reason || "Stock In",
      referenceNo: referenceNo || "",
      createdBy: uid,
      createdAt: new Date().toISOString(),
    });

    const transaction = await transactionRef.get();

    // Audit log
    await logAction({
      userId: uid,
      action: "stock_in",
      resourceType: "inventory",
      resourceId: productId,
      details: { productName: product.name, quantity: parseInt(quantity), newStock },
    });

    res.status(201).json({
      success: true,
      message: "Stock added successfully",
      transaction: {
        id: transaction.id,
        ...transaction.data(),
      },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * POST /api/inventory/stock-out
 * Remove stock from a product
 * Protected: inventory_staff, manager, admin
 *
 * Request body:
 *   - productId: string (required)
 *   - quantity: number (required, > 0, <= current stock)
 *   - reason: string (optional, e.g., "Damage", "Loss")
 *   - referenceNo: string (optional)
 *
 * Response: { success, message, transaction }
 */
export const stockOut = asyncHandler(async (req, res) => {
  await body("productId").trim().notEmpty().run(req);
  await body("quantity").isInt({ min: 1 }).run(req);
  await body("reason").optional().trim().run(req);
  await body("referenceNo").optional().trim().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { productId, quantity, reason, referenceNo } = req.body;
  const uid = req.user.uid;

  try {
    // Get product
    const productDoc = await db.collection("products").doc(productId).get();
    if (!productDoc.exists) {
      throw new ApiError(404, "Product not found");
    }

    const product = productDoc.data();

    // Check if sufficient stock
    if (product.stock < quantity) {
      throw new ApiError(400, `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
    }

    const newStock = product.stock - quantity;

    // Update product stock
    await db.collection("products").doc(productId).update({
      stock: newStock,
      updatedAt: new Date().toISOString(),
    });

    // Log transaction
    const transactionRef = await db.collection("inventoryTransactions").add({
      type: "stock_out",
      productId,
      productName: product.name,
      quantity: parseInt(quantity),
      previousStock: product.stock,
      newStock,
      reason: reason || "Stock Out",
      referenceNo: referenceNo || "",
      createdBy: uid,
      createdAt: new Date().toISOString(),
    });

    const transaction = await transactionRef.get();

    // Audit log
    await logAction({
      userId: uid,
      action: "stock_out",
      resourceType: "inventory",
      resourceId: productId,
      details: { productName: product.name, quantity: parseInt(quantity), newStock },
    });

    // Check for low stock and create notification
    if (product.reorderLevel > 0 && newStock <= product.reorderLevel) {
      await createLowStockNotification(productId, product.name, newStock, product.reorderLevel);
    }

    res.status(201).json({
      success: true,
      message: "Stock removed successfully",
      transaction: {
        id: transaction.id,
        ...transaction.data(),
      },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * POST /api/inventory/adjust
 * Adjust stock to a specific level (for inventory count corrections)
 * Protected: manager, admin
 *
 * Request body:
 *   - productId: string (required)
 *   - newStock: number (required, >= 0)
 *   - reason: string (required, e.g., "Physical Count Adjustment")
 *
 * Response: { success, message, transaction }
 */
export const adjustStock = asyncHandler(async (req, res) => {
  await body("productId").trim().notEmpty().run(req);
  await body("newStock").isInt({ min: 0 }).run(req);
  await body("reason").trim().notEmpty().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { productId, newStock, reason } = req.body;
  const uid = req.user.uid;

  try {
    // Get product
    const productDoc = await db.collection("products").doc(productId).get();
    if (!productDoc.exists) {
      throw new ApiError(404, "Product not found");
    }

    const product = productDoc.data();
    const previousStock = product.stock;
    const adjustmentQuantity = newStock - previousStock;

    // Update product stock
    await db.collection("products").doc(productId).update({
      stock: newStock,
      updatedAt: new Date().toISOString(),
    });

    // Log transaction
    const transactionRef = await db.collection("inventoryTransactions").add({
      type: "adjustment",
      productId,
      productName: product.name,
      quantity: Math.abs(adjustmentQuantity),
      previousStock,
      newStock,
      adjustmentType: adjustmentQuantity > 0 ? "increase" : "decrease",
      reason,
      createdBy: uid,
      createdAt: new Date().toISOString(),
    });

    const transaction = await transactionRef.get();

    // Audit log
    await logAction({
      userId: uid,
      action: "stock_adjust",
      resourceType: "inventory",
      resourceId: productId,
      details: { productName: product.name, previousStock, newStock: parseInt(newStock), reason },
    });

    // Check for low stock after adjustment
    if (product.reorderLevel > 0 && parseInt(newStock) <= product.reorderLevel) {
      await createLowStockNotification(productId, product.name, parseInt(newStock), product.reorderLevel);
    }

    res.status(201).json({
      success: true,
      message: "Stock adjusted successfully",
      transaction: {
        id: transaction.id,
        ...transaction.data(),
      },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/inventory/transactions
 * Get inventory transaction history
 * Protected: all authenticated users
 *
 * Query params:
 *   - productId: string (filter by product)
 *   - type: string (filter by transaction type: stock_in, stock_out, adjustment)
 *   - limit: number (default: 50)
 *
 * Response: { success, transactions, total }
 */
export const getTransactions = asyncHandler(async (req, res) => {
  const { productId, type, limit = 50 } = req.query;

  try {
    let query = db.collection("inventoryTransactions");

    if (productId) {
      query = query.where("productId", "==", productId);
    }

    if (type) {
      query = query.where("type", "==", type);
    }

    const snapshot = await query
      .orderBy("createdAt", "desc")
      .limit(parseInt(limit))
      .get();

    const transactions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      transactions,
      total: transactions.length,
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/inventory/low-stock
 * Get products that are low on stock
 * Protected: all authenticated users
 *
 * Response: { success, products, total }
 */
export const getLowStockProducts = asyncHandler(async (req, res) => {
  try {
    // Fetch all active products
    const snapshot = await db.collection("products").where("isActive", "==", true).get();
    const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Fetch latest predictions (if any) to consider reorderPoint/status
    const predsSnap = await db.collection("predictions").get();
    const predMap = {};
    predsSnap.docs.forEach((d) => {
      predMap[d.id] = d.data();
    });

    // Determine low-stock either by product.reorderLevel OR by prediction status
    const lowStockProducts = products
      .map((p) => {
        const prediction = predMap[p.id];
        return {
          id: p.id,
          name: p.name,
          sku: p.sku || "",
          category: p.category || "",
          stock: p.stock,
          reorderLevel: p.reorderLevel || 0,
          // include prediction fields if available
          predictedStatus: prediction?.status || null,
          predictedReorderPoint: prediction?.reorderPoint || null,
          predictedDaysRemaining: prediction?.daysRemaining ?? null,
        };
      })
      .filter((p) => {
        const byReorderLevel = p.reorderLevel > 0 && p.stock <= p.reorderLevel;
        const byPrediction = p.predictedStatus === "Restock Now" || p.predictedStatus === "Restock Soon";
        return byReorderLevel || byPrediction;
      })
      .sort((a, b) => a.stock - b.stock);

    res.status(200).json({ success: true, products: lowStockProducts, total: lowStockProducts.length });
  } catch (err) {
    throw err;
  }
});
