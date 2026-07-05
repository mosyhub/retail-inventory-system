// src/routes/predictionRoutes.js
//
// Predictive stock management endpoints.

import express from "express";
import {
  generatePredictions,
  getPredictions,
  getProductPrediction,
} from "../controllers/predictionController.js";
import { verifyToken, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.post("/generate", authorize("manager", "admin"), generatePredictions);
router.get("/", getPredictions);
router.get("/:productId", getProductPrediction);

export default router;
