// src/controllers/userController.js
//
// Handles user management: list users, view user, update roles, activate/deactivate, and create user.
// Admin-only operations.

import { body, validationResult, param } from "express-validator";
import { auth, db } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logAction } from "../utils/auditService.js";

/**
 * POST /api/users
 * Create a new user account (Admin only)
 */
export const createUser = asyncHandler(async (req, res) => {
  await body("email").isEmail().trim().toLowerCase().run(req);
  await body("firstName").trim().notEmpty().run(req);
  await body("lastName").trim().notEmpty().run(req);
  await body("role").isIn(["admin", "manager", "cashier", "inventory_staff"]).run(req);
  await body("password").isLength({ min: 6 }).run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { email, password, firstName, lastName, role } = req.body;
  const adminUid = req.user.uid;

  try {
    // 1. Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });
    const uid = userRecord.uid;

    // 2. Set Custom User Claims (role)
    await auth.setCustomUserClaims(uid, { role });

    // 3. Create profile in Firestore
    await db.collection("users").doc(uid).set({
      uid,
      email,
      firstName,
      lastName,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    });

    // 4. Log Action
    await logAction({
      userId: adminUid,
      userName: req.user.name || "Admin",
      action: "create_user",
      resourceType: "user",
      resourceId: uid,
      details: { email, role, firstName, lastName },
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        uid,
        email,
        firstName,
        lastName,
        role,
        isActive: true,
      },
    });
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      throw new ApiError(400, "Email already exists");
    }
    throw err;
  }
});

/**
 * GET /api/users
 * List all users
 * Protected: admin only
 *
 * Query params:
 *   - search: string (search by name or email)
 *   - role: string (filter by role)
 *   - status: string ("active" | "inactive")
 *
 * Response: { success, users, total }
 */
export const getUsers = asyncHandler(async (req, res) => {
  const { search, role, status } = req.query;

  try {
    let snapshot = await db.collection("users").get();
    let users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply role filter
    if (role) {
      users = users.filter((u) => u.role === role);
    }

    // Apply status filter
    if (status === "active") {
      users = users.filter((u) => u.isActive !== false);
    } else if (status === "inactive") {
      users = users.filter((u) => u.isActive === false);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.email?.toLowerCase().includes(searchLower) ||
          u.firstName?.toLowerCase().includes(searchLower) ||
          u.lastName?.toLowerCase().includes(searchLower)
      );
    }

    // Remove sensitive fields
    users = users.map((u) => ({
      id: u.id,
      uid: u.uid,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      isActive: u.isActive !== false,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    res.status(200).json({
      success: true,
      users,
      total: users.length,
    });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/users/:id
 * Get a single user by ID
 * Protected: admin only
 *
 * Response: { success, user }
 */
export const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const userDoc = await db.collection("users").doc(id).get();

    if (!userDoc.exists) {
      throw new ApiError(404, "User not found");
    }

    const user = userDoc.data();

    res.status(200).json({
      success: true,
      user: {
        id: userDoc.id,
        uid: user.uid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive !== false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * PATCH /api/users/:id/role
 * Update a user's role
 * Protected: admin only
 *
 * Request body:
 *   - role: string (one of: admin, manager, cashier, inventory_staff)
 *
 * Response: { success, message, user }
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  await body("role")
    .isIn(["admin", "manager", "cashier", "inventory_staff"])
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { id } = req.params;
  const { role } = req.body;
  const adminUid = req.user.uid;

  try {
    const userDoc = await db.collection("users").doc(id).get();

    if (!userDoc.exists) {
      throw new ApiError(404, "User not found");
    }

    const userData = userDoc.data();
    const oldRole = userData.role;

    // Update custom claims in Firebase Auth
    await auth.setCustomUserClaims(id, { role });

    // Update Firestore document
    await db.collection("users").doc(id).update({
      role,
      updatedAt: new Date().toISOString(),
    });

    // Audit log
    await logAction({
      userId: adminUid,
      userName: `${req.user.name || "Admin"}`,
      action: "update_user_role",
      resourceType: "user",
      resourceId: id,
      details: { oldRole, newRole: role, userEmail: userData.email },
    });

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role,
      },
    });
  } catch (err) {
    throw err;
  }
});

/**
 * PATCH /api/users/:id/deactivate
 * Deactivate a user account
 * Protected: admin only
 *
 * Response: { success, message }
 */
export const deactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminUid = req.user.uid;

  try {
    const userDoc = await db.collection("users").doc(id).get();

    if (!userDoc.exists) {
      throw new ApiError(404, "User not found");
    }

    // Prevent self-deactivation
    if (id === adminUid) {
      throw new ApiError(400, "Cannot deactivate your own account");
    }

    await db.collection("users").doc(id).update({
      isActive: false,
      updatedAt: new Date().toISOString(),
    });

    // Audit log
    await logAction({
      userId: adminUid,
      userName: `${req.user.name || "Admin"}`,
      action: "deactivate_user",
      resourceType: "user",
      resourceId: id,
      details: { userEmail: userDoc.data().email },
    });

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (err) {
    throw err;
  }
});

/**
 * PATCH /api/users/:id/activate
 * Activate a user account
 * Protected: admin only
 *
 * Response: { success, message }
 */
export const activateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminUid = req.user.uid;

  try {
    const userDoc = await db.collection("users").doc(id).get();

    if (!userDoc.exists) {
      throw new ApiError(404, "User not found");
    }

    await db.collection("users").doc(id).update({
      isActive: true,
      updatedAt: new Date().toISOString(),
    });

    // Audit log
    await logAction({
      userId: adminUid,
      userName: `${req.user.name || "Admin"}`,
      action: "activate_user",
      resourceType: "user",
      resourceId: id,
      details: { userEmail: userDoc.data().email },
    });

    res.status(200).json({
      success: true,
      message: "User activated successfully",
    });
  } catch (err) {
    throw err;
  }
});
