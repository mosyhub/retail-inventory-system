// src/controllers/predictionController.js
//
// Handles predictive stock management.
// Uses traditional forecasting techniques (non-ML) to calculate:
//   - Average Daily Sales
//   - Days Remaining
//   - Reorder Point (ROP)
//   - Safety Stock
//   - Recommended Order Quantity
//   - Status (Restock Now / Restock Soon / Sufficient)

import { db } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * POST /api/predictions/generate
 * Generate stock predictions for all active products.
 * Uses last 30 days of sales data with the following formulas:
 *
 *   averageSales = totalUnitsSold / numberOfDays
 *   daysRemaining = currentStock / averageSales
 *   reorderPoint = (averageSales × leadTime) + safetyStock
 *   recommendedQuantity = averageSales × 14   (target: 14 days of inventory)
 *
 *   Status Rules:
 *     IF currentStock <= reorderPoint  →  "Restock Now"
 *     IF daysRemaining < 7             →  "Restock Soon"
 *     ELSE                             →  "Sufficient"
 *
 * Protected: manager, admin
 *
 * Response: { success, message, predictions, total }
 */
export const generatePredictions = asyncHandler(async (req, res) => {
  try {
    // 1. Get all active products
    const productsSnap = await db
      .collection("products")
      .where("isActive", "==", true)
      .get();

    if (productsSnap.empty) {
      throw new ApiError(404, "No active products found");
    }

    // 2. Get sales from last 30 days
    const numberOfDays = 30;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - numberOfDays);

    const salesSnap = await db
      .collection("sales")
      .where("createdAt", ">=", thirtyDaysAgo.toISOString())
      .get();

    const sales = salesSnap.docs.map((doc) => doc.data());

    // 3. Aggregate total units sold per product
    const productSalesMap = {};
    sales.forEach((sale) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item) => {
          if (!productSalesMap[item.productId]) {
            productSalesMap[item.productId] = 0;
          }
          productSalesMap[item.productId] += item.quantity;
        });
      }
    });

    // 4. Generate predictions for each product using spec formulas
    const predictions = [];
    const batch = db.batch();

    productsSnap.docs.forEach((doc) => {
      const product = doc.data();
      const productId = doc.id;
      const totalUnitsSold = productSalesMap[productId] || 0;

      // --- Formula: Average Daily Sales ---
      // averageSales = totalUnitsSold / numberOfDays
      const averageDailySales = totalUnitsSold / numberOfDays;

      // --- Formula: Days Remaining ---
      // daysRemaining = currentStock / averageSales
      const daysRemaining =
        averageDailySales > 0
          ? Math.floor(product.stock / averageDailySales)
          : product.stock > 0
          ? 999 // Stock exists but no sales — effectively infinite
          : 0;

      // --- Safety Stock (from product field, or default to 0) ---
      const safetyStock = product.safetyStock || 0;

      // --- Supplier Lead Time (from product field, or default to 7 days) ---
      const leadTime = product.supplierLeadTime || 7;

      // --- Formula: Reorder Point (ROP) ---
      // reorderPoint = (averageSales × leadTime) + safetyStock
      const reorderPoint = Math.ceil(averageDailySales * leadTime) + safetyStock;

      // --- Formula: Recommended Order Quantity ---
      // recommendedQuantity = averageSales × 14 (target: 14 days of inventory)
      const recommendedQuantity = Math.ceil(averageDailySales * 14);

      // --- Status Rules ---
      // IF currentStock <= reorderPoint  →  "Restock Now"
      // IF daysRemaining < 7             →  "Restock Soon"
      // ELSE                             →  "Sufficient"
      let status;
      if (product.stock <= reorderPoint && averageDailySales > 0) {
        status = "Restock Now";
      } else if (daysRemaining < 7 && daysRemaining !== 999) {
        status = "Restock Soon";
      } else {
        status = "Sufficient";
      }

      // --- Estimated Reorder Date ---
      // When stock is expected to hit reorder point
      const daysUntilReorder =
        averageDailySales > 0
          ? Math.max(0, Math.floor((product.stock - reorderPoint) / averageDailySales))
          : 999;

      const estimatedReorderDate = new Date();
      estimatedReorderDate.setDate(estimatedReorderDate.getDate() + daysUntilReorder);

      // --- Estimated Stock-Out Date ---
      const estimatedStockoutDate = new Date();
      estimatedStockoutDate.setDate(
        estimatedStockoutDate.getDate() + (daysRemaining >= 999 ? 365 : daysRemaining)
      );

      const prediction = {
        productId,
        productName: product.name,
        sku: product.sku || "",
        barcode: product.barcode || "",
        currentStock: product.stock,
        minimumStock: product.minimumStock || 0,
        safetyStock,
        supplierLeadTime: leadTime,
        averageDailySales: Math.round(averageDailySales * 100) / 100,
        totalSoldLast30Days: totalUnitsSold,
        daysRemaining,
        reorderPoint,
        recommendedQuantity,
        status,
        estimatedReorderDate: estimatedReorderDate.toISOString().split("T")[0],
        estimatedStockoutDate: estimatedStockoutDate.toISOString().split("T")[0],
        lastUpdated: new Date().toISOString(),
      };

      predictions.push({ id: productId, ...prediction });

      // Store prediction in Firestore (upsert)
      const predRef = db.collection("predictions").doc(productId);
      batch.set(predRef, prediction, { merge: true });
    });

    // Commit batch write
    await batch.commit();

    res.status(200).json({
      success: true,
      message: `Predictions generated for ${predictions.length} products`,
      predictions,
      total: predictions.length,
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/predictions
 * Get all stored predictions
 * Protected: all authenticated
 *
 * Response: { success, predictions, total }
 */
export const getPredictions = asyncHandler(async (req, res) => {
  try {
    const snapshot = await db.collection("predictions").get();

    const predictions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by urgency: "Restock Now" first, then "Restock Soon", then "Sufficient"
    const statusOrder = { "Restock Now": 0, "Restock Soon": 1, "Sufficient": 2 };
    predictions.sort((a, b) => {
      const orderDiff = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
      if (orderDiff !== 0) return orderDiff;
      return a.daysRemaining - b.daysRemaining;
    });

    res.status(200).json({
      success: true,
      predictions,
      total: predictions.length,
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/predictions/:productId
 * Get prediction for a single product
 * Protected: all authenticated
 *
 * Response: { success, prediction }
 */
export const getProductPrediction = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  try {
    const doc = await db.collection("predictions").doc(productId).get();

    if (!doc.exists) {
      throw new ApiError(
        404,
        "Prediction not found for this product. Generate predictions first."
      );
    }

    res.status(200).json({
      success: true,
      prediction: { id: doc.id, ...doc.data() },
    });
  } catch (err) {
    throw err;
  }
});
