// src/controllers/reportController.js
//
// Handles report generation and analytics queries.

import { body, validationResult } from "express-validator";
import { db } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * GET /api/reports/sales-report
 * Generate sales report for a date range
 * Protected: manager, admin
 *
 * Query params:
 *   - startDate: ISO date (required)
 *   - endDate: ISO date (required)
 *   - groupBy: string (daily, weekly, monthly - default: daily)
 *
 * Response: { success, report }
 */
export const getSalesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = "daily" } = req.query;

  if (!startDate || !endDate) {
    throw new ApiError(400, "startDate and endDate are required");
  }

  try {
    const snapshot = await db
      .collection("sales")
      .where("createdAt", ">=", new Date(startDate).toISOString())
      .where("createdAt", "<=", new Date(endDate).toISOString())
      .get();

    const orders = snapshot.docs.map((doc) => doc.data());

    // Group by date
    const grouped = {};
    orders.forEach((order) => {
      const date = order.createdAt.split("T")[0]; // YYYY-MM-DD
      if (!grouped[date]) {
        grouped[date] = {
          date,
          orders: 0,
          revenue: 0,
          items: 0,
        };
      }
      grouped[date].orders++;
      grouped[date].revenue += order.totalAmount;
      grouped[date].items += order.items.reduce((sum, item) => sum + item.quantity, 0);
    });

    const reportData = Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));

    const totals = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      totalItems: orders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0), 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0,
    };

    res.status(200).json({
      success: true,
      report: {
        dateRange: { startDate, endDate },
        groupBy,
        data: reportData,
        totals,
      },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/reports/inventory-report
 * Generate inventory report
 * Protected: manager, admin
 *
 * Query params:
 *   - category: string (optional, filter by category)
 *
 * Response: { success, report }
 */
export const getInventoryReport = asyncHandler(async (req, res) => {
  const { category } = req.query;

  try {
    let query = db.collection("products").where("isActive", "==", true);

    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.get();
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate metrics
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + p.stock * p.price, 0);
    const averageStock = products.reduce((sum, p) => sum + p.stock, 0) / totalProducts;

    const stockStatus = {
      optimal: products.filter((p) => p.stock > p.reorderLevel || p.reorderLevel === 0).length,
      lowStock: products.filter((p) => p.stock <= p.reorderLevel && p.reorderLevel > 0).length,
      outOfStock: products.filter((p) => p.stock === 0).length,
    };

    // Top products by value
    const topByValue = products
      .map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        value: p.stock * p.price,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      report: {
        totalProducts,
        totalValue: Math.round(totalValue * 100) / 100,
        averageStock: Math.round(averageStock * 100) / 100,
        stockStatus,
        topByValue,
        products,
      },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/reports/top-products
 * Get top selling products
 * Protected: manager, admin
 *
 * Query params:
 *   - startDate: ISO date
 *   - endDate: ISO date
 *   - limit: number (default: 10)
 *
 * Response: { success, products }
 */
export const getTopProducts = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 10 } = req.query;

  try {
    let query = db.collection("sales");

    if (startDate && endDate) {
      query = query
        .where("createdAt", ">=", new Date(startDate).toISOString())
        .where("createdAt", "<=", new Date(endDate).toISOString());
    }

    const snapshot = await query.get();
    const orders = snapshot.docs.map((doc) => doc.data());

    // Aggregate product sales
    const productSales = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.subtotal;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      products: topProducts,
      total: topProducts.length,
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/reports/dashboard-stats
 * Get quick statistics for dashboard
 * Protected: all authenticated users
 *
 * Response: { success, stats }
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Today's sales
    const todaySalesSnapshot = await db
      .collection("sales")
      .where("createdAt", ">=", `${today}T00:00:00.000Z`)
      .where("createdAt", "<=", `${today}T23:59:59.999Z`)
      .get();

    const todaySales = todaySalesSnapshot.docs.map((doc) => doc.data());
    const todayRevenue = todaySales.reduce((sum, order) => sum + order.totalAmount, 0);

    // Product counts
    const productsSnapshot = await db.collection("products").where("isActive", "==", true).get();
    const allProducts = productsSnapshot.docs.map((doc) => doc.data());

    const totalProducts = allProducts.length;
    const lowStockProducts = allProducts.filter(
      (p) => p.stock <= p.reorderLevel && p.reorderLevel > 0
    ).length;
    const outOfStockProducts = allProducts.filter((p) => p.stock === 0).length;

    // Inventory value
    const inventoryValue = allProducts.reduce((sum, p) => sum + p.stock * p.price, 0);

    res.status(200).json({
      success: true,
      stats: {
        today: {
          orders: todaySales.length,
          revenue: Math.round(todayRevenue * 100) / 100,
        },
        inventory: {
          totalProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
          value: Math.round(inventoryValue * 100) / 100,
        },
      },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/reports/sales-by-category
 * Get sales breakdown by product category
 * Protected: manager, admin
 *
 * Query params:
 *   - startDate: ISO date
 *   - endDate: ISO date
 *
 * Response: { success, breakdown }
 */
export const getSalesByCategory = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    let query = db.collection("sales");

    if (startDate && endDate) {
      query = query
        .where("createdAt", ">=", new Date(startDate).toISOString())
        .where("createdAt", "<=", new Date(endDate).toISOString());
    }

    const ordersSnapshot = await query.get();
    const orders = ordersSnapshot.docs.map((doc) => doc.data());

    // Get product categories
    const productsSnapshot = await db.collection("products").get();
    const productCategories = {};
    productsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      productCategories[data.name] = data.category;
    });

    // Aggregate by category
    const categoryBreakdown = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        // Find category from products (fallback if not found)
        const category = productCategories[item.productName] || "Other";

        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = {
            category,
            orders: 0,
            revenue: 0,
            quantity: 0,
          };
        }
        categoryBreakdown[category].revenue += item.subtotal;
        categoryBreakdown[category].quantity += item.quantity;
      });
    });

    const breakdown = Object.values(categoryBreakdown).sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({
      success: true,
      breakdown,
    });
  } catch (err) {
    throw err;
  }
});
