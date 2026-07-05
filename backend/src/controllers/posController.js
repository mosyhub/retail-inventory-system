// src/controllers/posController.js
//
// Handles Point of Sale operations: create orders, calculate totals, process sales.

import { body, validationResult } from "express-validator";
import { db } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logAction } from "../utils/auditService.js";
import { createLowStockNotification } from "./notificationController.js";

/**
 * POST /api/pos/orders
 * Create a new sale order
 * Protected: cashier, manager, admin
 *
 * Request body:
 *   - items: Array of { productId, quantity, price }
 *   - paymentMethod: string (cash, card, check)
 *   - notes: string (optional)
 *
 * Response: { success, message, order }
 */
export const createOrder = asyncHandler(async (req, res) => {
  await body("items").isArray({ min: 1 }).run(req);
  await body("items.*.productId").trim().notEmpty().run(req);
  await body("items.*.quantity").isInt({ min: 1 }).run(req);
  await body("items.*.price").isFloat({ min: 0.01 }).run(req);
  await body("paymentMethod").isIn(["cash", "card", "check"]).run(req);
  await body("notes").optional().trim().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { items, paymentMethod, notes } = req.body;
  const uid = req.user.uid;
  const userRole = req.user.role;

  try {
    let totalAmount = 0;
    let orderItems = [];

    // Validate products and calculate total
    for (const item of items) {
      const productDoc = await db.collection("products").doc(item.productId).get();

      if (!productDoc.exists) {
        throw new ApiError(404, `Product ${item.productId} not found`);
      }

      const product = productDoc.data();

      // Check stock
      if (product.stock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for ${product.name}. Available: ${product.stock}`);
      }

      const itemTotal = item.quantity * item.price;
      totalAmount += itemTotal;

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        price: item.price,
        subtotal: itemTotal,
      });

      // Deduct stock
      const newStock = product.stock - item.quantity;
      await db.collection("products").doc(item.productId).update({
        stock: newStock,
        updatedAt: new Date().toISOString(),
      });

      // Log inventory transaction
      await db.collection("inventoryTransactions").add({
        type: "sale",
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        previousStock: product.stock,
        newStock,
        reason: "Sale",
        referenceNo: `Sale-${new Date().getTime()}`,
        createdBy: uid,
        createdAt: new Date().toISOString(),
      });

      // Check for low stock and create notification
      if (product.reorderLevel > 0 && newStock <= product.reorderLevel) {
        await createLowStockNotification(item.productId, product.name, newStock, product.reorderLevel);
      }
    }

    // Create order
    const orderRef = await db.collection("sales").add({
      orderNo: `ORD-${Date.now()}`,
      items: orderItems,
      totalAmount,
      paymentMethod,
      notes: notes || "",
      status: "completed",
      cashier: uid,
      cashierRole: userRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const order = await orderRef.get();

    // Audit log
    await logAction({
      userId: uid,
      action: "create_order",
      resourceType: "sale",
      resourceId: order.id,
      details: { totalAmount, itemCount: orderItems.length, paymentMethod },
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        id: order.id,
        ...order.data(),
      },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/pos/orders
 * Get sales history
 * Protected: all authenticated users
 *
 * Query params:
 *   - limit: number (default: 50)
 *   - startDate: ISO date (filter by date range)
 *   - endDate: ISO date
 *
 * Response: { success, orders, total }
 */
export const getOrders = asyncHandler(async (req, res) => {
  const { limit = 50, startDate, endDate } = req.query;

  try {
    let query = db.collection("sales");

    if (startDate || endDate) {
      if (startDate) {
        query = query.where("createdAt", ">=", new Date(startDate).toISOString());
      }
      if (endDate) {
        query = query.where("createdAt", "<=", new Date(endDate).toISOString());
      }
    }

    const snapshot = await query
      .orderBy("createdAt", "desc")
      .limit(parseInt(limit))
      .get();

    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      orders,
      total: orders.length,
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/pos/orders/:id
 * Get a single order
 * Protected: all authenticated users
 *
 * Response: { success, order }
 */
export const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const order = await db.collection("sales").doc(id).get();

    if (!order.exists) {
      throw new ApiError(404, "Order not found");
    }

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        ...order.data(),
      },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/pos/sales-summary
 * Get sales statistics for a date range
 * Protected: manager, admin
 *
 * Query params:
 *   - startDate: ISO date (default: today)
 *   - endDate: ISO date (default: today)
 *
 * Response: { success, summary }
 */
export const getSalesSummary = asyncHandler(async (req, res) => {
  const { startDate = new Date().toISOString().split("T")[0], endDate = new Date().toISOString().split("T")[0] } = req.query;

  try {
    const snapshot = await db
      .collection("sales")
      .where("createdAt", ">=", `${startDate}T00:00:00.000Z`)
      .where("createdAt", "<=", `${endDate}T23:59:59.999Z`)
      .get();

    const orders = snapshot.docs.map((doc) => doc.data());

    const totalSales = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    const paymentBreakdown = {};
    orders.forEach((order) => {
      if (!paymentBreakdown[order.paymentMethod]) {
        paymentBreakdown[order.paymentMethod] = 0;
      }
      paymentBreakdown[order.paymentMethod] += order.totalAmount;
    });

    res.status(200).json({
      success: true,
      summary: {
        dateRange: { startDate, endDate },
        totalSales,
        totalRevenue,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        paymentBreakdown,
      },
    });
  } catch (err) {
    throw err;
  }
});
