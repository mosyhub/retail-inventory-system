// src/controllers/productController.js
//
// Handles product CRUD operations: create, read, update, delete.
// All products are stored in Firestore with role-based access control.

import { body, validationResult, param } from "express-validator";
import { db } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logAction } from "../utils/auditService.js";

/**
 * POST /api/products
 * Create a new product
 * Protected: manager, admin only
 *
 * Request body:
 *   - name: string (required, unique)
 *   - description: string (optional)
 *   - sku: string (required, unique)
 *   - category: string (required)
 *   - price: number (required, > 0)
 *   - cost: number (optional, cost per unit)
 *   - stock: number (required, >= 0)
 *   - reorderLevel: number (optional, alert when stock falls below)
 *
 * Response: { success, message, product }
 */
export const createProduct = asyncHandler(async (req, res) => {
  // Validate input
  await body("name").trim().notEmpty().isLength({ min: 2 }).run(req);
  await body("sku").trim().notEmpty().run(req);
  await body("category").trim().notEmpty().run(req);
  await body("price").isFloat({ min: 0.01 }).run(req);
  await body("stock").isInt({ min: 0 }).run(req);
  await body("description").optional().trim().run(req);
  await body("cost").optional().isFloat({ min: 0 }).run(req);
  await body("reorderLevel").optional().isInt({ min: 0 }).run(req);
  await body("barcode").optional().trim().run(req);
  await body("minimumStock").optional().isInt({ min: 0 }).run(req);
  await body("safetyStock").optional().isInt({ min: 0 }).run(req);
  await body("supplierLeadTime").optional().isInt({ min: 0 }).run(req);
  await body("supplierId").optional().trim().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const {
    name,
    description,
    sku,
    category,
    price,
    cost,
    stock,
    reorderLevel,
    barcode,
    minimumStock,
    safetyStock,
    supplierLeadTime,
    supplierId,
  } = req.body;
  const uid = req.user.uid;

  try {
    // Check if product with same SKU already exists
    const existingSku = await db.collection("products").where("sku", "==", sku).get();
    if (!existingSku.empty) {
      throw new ApiError(400, "Product with this SKU already exists");
    }

    // Create product document
    const productRef = await db.collection("products").add({
      name,
      description: description || "",
      sku,
      category,
      price: parseFloat(price),
      cost: cost ? parseFloat(cost) : 0,
      stock: parseInt(stock),
      reorderLevel: reorderLevel || 0,
      barcode: barcode || "",
      minimumStock: minimumStock ? parseInt(minimumStock) : 0,
      safetyStock: safetyStock ? parseInt(safetyStock) : 0,
      supplierLeadTime: supplierLeadTime ? parseInt(supplierLeadTime) : 0,
      supplierId: supplierId || "",
      createdBy: uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    });

    const product = await productRef.get();

    // Audit log
    await logAction({
      userId: uid,
      action: "create_product",
      resourceType: "product",
      resourceId: product.id,
      details: { name, sku, category, price: parseFloat(price) },
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: {
        id: product.id,
        ...product.data(),
      },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/products
 * Get all products with optional filters
 * Public (but protected route — requires auth)
 *
 * Query params:
 *   - category: string (filter by category)
 *   - lowStock: boolean (show only low stock items)
 *   - search: string (search by name or SKU)
 *
 * Response: { success, products, total }
 */
export const getProducts = asyncHandler(async (req, res) => {
  const { category, lowStock, search } = req.query;

  try {
    let query = db.collection("products").where("isActive", "==", true);

    // Apply category filter
    if (category) {
      query = query.where("category", "==", category);
    }

    // Execute query
    let snapshot = await query.get();
    let products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply search filter (client-side since Firestore doesn't support full-text search easily)
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower)
      );
    }

    // Apply low stock filter
    if (lowStock === "true") {
      products = products.filter((p) => p.stock <= p.reorderLevel && p.reorderLevel > 0);
    }

    res.status(200).json({
      success: true,
      products,
      total: products.length,
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/products/:id
 * Get a single product by ID
 * Protected: manager, admin only
 *
 * Response: { success, product }
 */
export const getProduct = asyncHandler(async (req, res) => {
  await param("id").trim().notEmpty().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { id } = req.params;

  try {
    const product = await db.collection("products").doc(id).get();

    if (!product.exists) {
      throw new ApiError(404, "Product not found");
    }

    res.status(200).json({
      success: true,
      product: {
        id: product.id,
        ...product.data(),
      },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * PATCH /api/products/:id
 * Update a product
 * Protected: manager, admin only
 *
 * Request body: Any of { name, description, price, cost, stock, category, reorderLevel }
 *
 * Response: { success, message, product }
 */
export const updateProduct = asyncHandler(async (req, res) => {
  await param("id").trim().notEmpty().run(req);
  await body("name").optional().trim().isLength({ min: 2 }).run(req);
  await body("price").optional().isFloat({ min: 0.01 }).run(req);
  await body("stock").optional().isInt({ min: 0 }).run(req);
  await body("cost").optional().isFloat({ min: 0 }).run(req);
  await body("reorderLevel").optional().isInt({ min: 0 }).run(req);
  await body("barcode").optional().trim().run(req);
  await body("minimumStock").optional().isInt({ min: 0 }).run(req);
  await body("safetyStock").optional().isInt({ min: 0 }).run(req);
  await body("supplierLeadTime").optional().isInt({ min: 0 }).run(req);
  await body("supplierId").optional().trim().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { id } = req.params;
  const updates = {};

  // Only include fields that are provided
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.price !== undefined) updates.price = parseFloat(req.body.price);
  if (req.body.cost !== undefined) updates.cost = parseFloat(req.body.cost);
  if (req.body.stock !== undefined) updates.stock = parseInt(req.body.stock);
  if (req.body.category !== undefined) updates.category = req.body.category;
  if (req.body.reorderLevel !== undefined) updates.reorderLevel = parseInt(req.body.reorderLevel);
  if (req.body.barcode !== undefined) updates.barcode = req.body.barcode;
  if (req.body.minimumStock !== undefined) updates.minimumStock = parseInt(req.body.minimumStock);
  if (req.body.safetyStock !== undefined) updates.safetyStock = parseInt(req.body.safetyStock);
  if (req.body.supplierLeadTime !== undefined) updates.supplierLeadTime = parseInt(req.body.supplierLeadTime);
  if (req.body.supplierId !== undefined) updates.supplierId = req.body.supplierId;

  updates.updatedAt = new Date().toISOString();

  try {
    const product = await db.collection("products").doc(id).get();

    if (!product.exists) {
      throw new ApiError(404, "Product not found");
    }

    await db.collection("products").doc(id).update(updates);

    const updated = await db.collection("products").doc(id).get();

    // Audit log
    await logAction({
      userId: req.user.uid,
      action: "update_product",
      resourceType: "product",
      resourceId: id,
      details: updates,
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: {
        id: updated.id,
        ...updated.data(),
      },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * DELETE /api/products/:id
 * Soft-delete a product (set isActive to false)
 * Protected: admin only
 *
 * Response: { success, message }
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  await param("id").trim().notEmpty().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { id } = req.params;

  try {
    const product = await db.collection("products").doc(id).get();

    if (!product.exists) {
      throw new ApiError(404, "Product not found");
    }

    // Soft delete
    await db.collection("products").doc(id).update({
      isActive: false,
      updatedAt: new Date().toISOString(),
    });

    // Audit log
    await logAction({
      userId: req.user.uid,
      action: "delete_product",
      resourceType: "product",
      resourceId: id,
      details: { name: product.data().name },
    });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/products/categories/all
 * Get all unique product categories
 * Public (but protected route)
 *
 * Response: { success, categories }
 */
export const getCategories = asyncHandler(async (req, res) => {
  try {
    const snapshot = await db.collection("products").where("isActive", "==", true).get();
    const categories = [...new Set(snapshot.docs.map((doc) => doc.data().category))];

    res.status(200).json({
      success: true,
      categories: categories.sort(),
    });
  } catch (err) {
    throw err;
  }
});
