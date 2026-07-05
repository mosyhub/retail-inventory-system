// src/routes/authRoutes.js
//
// Defines all authentication endpoints (signup, login, logout, getCurrentUser).

import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { signup, login, logout, getCurrentUser } from "../controllers/authController.js";

const router = express.Router();

/**
 * POST /api/auth/signup
 * Create a new user account
 * Body: { email, password, firstName, lastName, role }
 */
router.post("/signup", asyncHandler(signup));

/**
 * POST /api/auth/login
 * Authenticate user and return user data + token
 * Body: { idToken }
 */
router.post("/login", asyncHandler(login));

/**
 * POST /api/auth/logout
 * Logout user (protected route)
 * Headers: Authorization: Bearer <token>
 */
router.post("/logout", verifyToken, asyncHandler(logout));

/**
 * GET /api/auth/me
 * Get current authenticated user's profile (protected route)
 * Headers: Authorization: Bearer <token>
 */
router.get("/me", verifyToken, asyncHandler(getCurrentUser));

export default router;
