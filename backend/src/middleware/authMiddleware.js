// src/middleware/authMiddleware.js
//
// Middleware to verify Firebase ID tokens on protected routes.
// Every protected request must include an "Authorization: Bearer <token>" header.

import { auth } from "../config/firebase.js";
import ApiError from "../utils/ApiError.js";

/**
 * Middleware: Extract and verify the ID token from the Authorization header.
 *
 * If valid:
 *   - req.user is populated with { uid, email, role, ... }
 *   - Execution continues to the next middleware/controller
 *
 * If invalid/missing:
 *   - Throws ApiError(401, "Unauthorized")
 *   - Caught by asyncHandler and passed to errorHandler
 */
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Unauthorized - missing or invalid Authorization header");
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  try {
    // Firebase Admin SDK verifies the token's signature and returns the decoded payload
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken; // Contains uid, email, claims (custom attributes), etc.
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    throw new ApiError(401, "Unauthorized - invalid or expired token");
  }
};

/**
 * Higher-order middleware: Verify token AND check that the user has one of the allowed roles.
 *
 * Usage:
 *   router.delete("/products/:id", authorize("admin"), deleteProduct);
 *
 * This ensures only admins can delete products.
 */
export const authorize = (...allowedRoles) => async (req, res, next) => {
  // First, verify the token (or throw)
  await verifyToken(req, res, () => {});


  const userRole = req.user.role || "cashier"; // 
  if (!allowedRoles.includes(userRole)) {
    throw new ApiError(
      403,
      `Forbidden - ${userRole} role is not allowed for this action. Required: ${allowedRoles.join(", ")}`
    );
  }

  next();
};
