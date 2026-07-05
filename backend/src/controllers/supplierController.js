// src/controllers/supplierController.js
//
// Handles supplier CRUD operations.
// Suppliers are stored in their own Firestore collection.

import { body, validationResult } from "express-validator";
import { db } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logAction } from "../utils/auditService.js";

/**
 * POST /api/suppliers
 * Create a new supplier
 * Protected: manager, admin
 *
 * Request body:
 *   - name: string (required)
 *   - contactPerson: string (optional)
 *   - email: string (optional)
 *   - phone: string (optional)
 *   - address: string (optional)
 *
 * Response: { success, message, supplier }
 */
export const createSupplier = asyncHandler(async (req, res) => {
  await body("name").trim().notEmpty().isLength({ min: 2 }).run(req);
  await body("contactPerson").optional().trim().run(req);
  await body("email").optional().isEmail().trim().run(req);
  await body("phone").optional().trim().run(req);
  await body("address").optional().trim().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { name, contactPerson, email, phone, address } = req.body;
  const uid = req.user.uid;

  try {
    // Check for duplicate name
    const existing = await db
      .collection("suppliers")
      .where("name", "==", name)
      .where("isActive", "==", true)
      .get();
    if (!existing.empty) {
      throw new ApiError(400, "Supplier with this name already exists");
    }

    const supplierRef = await db.collection("suppliers").add({
      name,
      contactPerson: contactPerson || "",
      email: email || "",
      phone: phone || "",
      address: address || "",
      isActive: true,
      createdBy: uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const supplier = await supplierRef.get();

    await logAction({
      userId: uid,
      action: "create_supplier",
      resourceType: "supplier",
      resourceId: supplier.id,
      details: { name },
    });

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      supplier: { id: supplier.id, ...supplier.data() },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/suppliers
 * Get all active suppliers
 * Protected: all authenticated
 *
 * Response: { success, suppliers, total }
 */
export const getSuppliers = asyncHandler(async (req, res) => {
  try {
    const snapshot = await db
      .collection("suppliers")
      .where("isActive", "==", true)
      .get();

    const suppliers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      suppliers,
      total: suppliers.length,
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/suppliers/:id
 * Get a single supplier
 * Protected: all authenticated
 *
 * Response: { success, supplier }
 */
export const getSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection("suppliers").doc(id).get();

    if (!doc.exists) {
      throw new ApiError(404, "Supplier not found");
    }

    res.status(200).json({
      success: true,
      supplier: { id: doc.id, ...doc.data() },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * PATCH /api/suppliers/:id
 * Update a supplier
 * Protected: manager, admin
 *
 * Response: { success, message, supplier }
 */
export const updateSupplier = asyncHandler(async (req, res) => {
  await body("name").optional().trim().isLength({ min: 2 }).run(req);
  await body("email").optional().isEmail().trim().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { id } = req.params;
  const uid = req.user.uid;

  try {
    const doc = await db.collection("suppliers").doc(id).get();
    if (!doc.exists) {
      throw new ApiError(404, "Supplier not found");
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.contactPerson !== undefined) updates.contactPerson = req.body.contactPerson;
    if (req.body.email !== undefined) updates.email = req.body.email;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.address !== undefined) updates.address = req.body.address;
    updates.updatedAt = new Date().toISOString();

    await db.collection("suppliers").doc(id).update(updates);

    const updated = await db.collection("suppliers").doc(id).get();

    await logAction({
      userId: uid,
      action: "update_supplier",
      resourceType: "supplier",
      resourceId: id,
      details: updates,
    });

    res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      supplier: { id: updated.id, ...updated.data() },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * DELETE /api/suppliers/:id
 * Soft-delete a supplier
 * Protected: admin only
 *
 * Response: { success, message }
 */
export const deleteSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const uid = req.user.uid;

  try {
    const doc = await db.collection("suppliers").doc(id).get();
    if (!doc.exists) {
      throw new ApiError(404, "Supplier not found");
    }

    await db.collection("suppliers").doc(id).update({
      isActive: false,
      updatedAt: new Date().toISOString(),
    });

    await logAction({
      userId: uid,
      action: "delete_supplier",
      resourceType: "supplier",
      resourceId: id,
      details: { name: doc.data().name },
    });

    res.status(200).json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (err) {
    throw err;
  }
});
