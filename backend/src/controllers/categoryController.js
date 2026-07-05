// src/controllers/categoryController.js
//
// Handles category CRUD operations.
// Categories are stored in their own Firestore collection for independent management.

import { body, validationResult } from "express-validator";
import { db } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logAction } from "../utils/auditService.js";

/**
 * POST /api/categories
 * Create a new category
 * Protected: manager, admin
 *
 * Request body:
 *   - name: string (required)
 *   - description: string (optional)
 *
 * Response: { success, message, category }
 */
export const createCategory = asyncHandler(async (req, res) => {
  await body("name").trim().notEmpty().isLength({ min: 2 }).run(req);
  await body("description").optional().trim().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { name, description } = req.body;
  const uid = req.user.uid;

  try {
    // Check for duplicate
    const existing = await db
      .collection("categories")
      .where("name", "==", name)
      .where("isActive", "==", true)
      .get();
    if (!existing.empty) {
      throw new ApiError(400, "Category with this name already exists");
    }

    const catRef = await db.collection("categories").add({
      name,
      description: description || "",
      isActive: true,
      createdBy: uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const category = await catRef.get();

    await logAction({
      userId: uid,
      action: "create_category",
      resourceType: "category",
      resourceId: category.id,
      details: { name },
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: { id: category.id, ...category.data() },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/categories
 * Get all active categories
 * Protected: all authenticated
 *
 * Response: { success, categories, total }
 */
export const getCategories = asyncHandler(async (req, res) => {
  try {
    const snapshot = await db
      .collection("categories")
      .where("isActive", "==", true)
      .get();

    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      categories,
      total: categories.length,
    });
  } catch (err) {
    throw err;
  }
});

/**
 * PATCH /api/categories/:id
 * Update a category
 * Protected: manager, admin
 *
 * Response: { success, message, category }
 */
export const updateCategory = asyncHandler(async (req, res) => {
  await body("name").optional().trim().isLength({ min: 2 }).run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { id } = req.params;
  const uid = req.user.uid;

  try {
    const doc = await db.collection("categories").doc(id).get();
    if (!doc.exists) {
      throw new ApiError(404, "Category not found");
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    updates.updatedAt = new Date().toISOString();

    await db.collection("categories").doc(id).update(updates);

    const updated = await db.collection("categories").doc(id).get();

    await logAction({
      userId: uid,
      action: "update_category",
      resourceType: "category",
      resourceId: id,
      details: updates,
    });

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: { id: updated.id, ...updated.data() },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * DELETE /api/categories/:id
 * Soft-delete a category
 * Protected: admin only
 *
 * Response: { success, message }
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const uid = req.user.uid;

  try {
    const doc = await db.collection("categories").doc(id).get();
    if (!doc.exists) {
      throw new ApiError(404, "Category not found");
    }

    await db.collection("categories").doc(id).update({
      isActive: false,
      updatedAt: new Date().toISOString(),
    });

    await logAction({
      userId: uid,
      action: "delete_category",
      resourceType: "category",
      resourceId: id,
      details: { name: doc.data().name },
    });

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (err) {
    throw err;
  }
});
