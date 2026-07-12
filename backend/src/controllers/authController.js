// src/controllers/authController.js
//
// Handles user authentication: signup, login, logout.
// Uses Firebase Authentication for credential verification + Firestore for user data storage.

import { body, validationResult } from "express-validator";
import { auth, db } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logAction } from "../utils/auditService.js";

export const signup = asyncHandler(async (req, res) => {
  // Validate input
  await body("email").isEmail().trim().toLowerCase().run(req);
  await body("firstName").trim().notEmpty().run(req);
  await body("lastName").trim().notEmpty().run(req);
  await body("idToken").trim().notEmpty().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { email, firstName, lastName, idToken } = req.body;
  const role = "cashier"; // Default role for new signups

  try {
    // Verify the ID token from Firebase (frontend already created the user)
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Check if user already exists in Firestore
    const existingUser = await db.collection("users").doc(uid).get();
    if (existingUser.exists) {
      throw new ApiError(400, "User already registered");
    }

    // Set custom claims (role) on the Firebase user
    // This will be included in the ID token payload on next login
    await auth.setCustomUserClaims(uid, { role });

    // Create user document in Firestore with metadata
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

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        uid,
        email,
        firstName,
        lastName,
        role,
        createdAt: new Date().toISOString(),
      },
      idToken,
    });

    // Audit log (fire-and-forget after response)
    logAction({
      userId: uid,
      userName: `${firstName} ${lastName}`,
      action: "signup",
      resourceType: "user",
      resourceId: uid,
      details: { email, role },
    });
  } catch (err) {
    if (err.code === "auth/invalid-id-token") {
      throw new ApiError(401, "Invalid ID token");
    }
    if (err.code === "auth/id-token-expired") {
      throw new ApiError(401, "ID token expired");
    }
    throw err;
  }
});

export const login = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw new ApiError(400, "idToken is required");
  }

  try {
    // Verify the ID token from Firebase Client SDK
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch user data from Firestore
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      // User is authenticated in Firebase but has no Firestore record
      // This shouldn't happen in normal flow, but handle gracefully
      throw new ApiError(404, "User profile not found");
    }

    const user = userDoc.data();

    // Check if user is active (soft-delete support)
    if (!user.isActive) {
      throw new ApiError(403, "User account is inactive");
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        uid: user.uid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      },
      idToken, // Return token for frontend convenience
    });

    // Audit log (fire-and-forget)
    logAction({
      userId: uid,
      userName: `${user.firstName} ${user.lastName}`,
      action: "login",
      resourceType: "user",
      resourceId: uid,
    });
  } catch (err) {
    if (err.code === "auth/id-token-expired") {
      throw new ApiError(401, "Token expired");
    }
    if (err.code === "auth/invalid-id-token") {
      throw new ApiError(401, "Invalid token");
    }
    throw err;
  }
});

export const logout = asyncHandler(async (req, res) => {
 
  const uid = req.user.uid;

  // Audit log (fire-and-forget)
  logAction({
    userId: uid,
    action: "logout",
    resourceType: "user",
    resourceId: uid,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user's profile.
 * Protected route — requires valid ID token.
 * Used by frontend after login to refresh user state.
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const uid = req.user.uid;

  const userDoc = await db.collection("users").doc(uid).get();

  if (!userDoc.exists) {
    throw new ApiError(404, "User profile not found");
  }

  const user = userDoc.data();

  res.status(200).json({
    success: true,
    user: {
      uid: user.uid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});
