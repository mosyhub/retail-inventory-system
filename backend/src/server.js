// src/server.js
//
// Application entry point. Responsibilities:
//   1. Load environment variables
//   2. Initialize Firebase Admin SDK (via src/config/firebase.js import side-effect)
//   3. Configure global middleware (CORS, JSON body parsing, logging)
//   4. Mount feature routes (added module-by-module as we build them)
//   5. Mount 404 + global error handlers (must be LAST)

import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import "./config/firebase.js"; // side-effect import: initializes Firebase Admin SDK on boot
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import posRoutes from "./routes/posRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import predictionRoutes from "./routes/predictionRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Global Middleware ----------

// Allow the React frontend (different port/origin) to call this API.
// In production, CLIENT_URL should be your deployed frontend's exact URL.
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Parse incoming JSON request bodies into req.body
app.use(express.json());

// HTTP request logger — prints method, path, status, response time to console.
// "dev" format is colorized and concise, good for local development.
app.use(morgan("dev"));

// ---------- Health Check ----------
// Useful for confirming the server is up, and for deployment platforms
// (Render/Railway) that ping a health endpoint to verify the app is alive.
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// ---------- Feature Routes ----------
app.use("/api/auth", authRoutes);                    // Module 1: Authentication
app.use("/api/users", userRoutes);                   // Module 2: User Management
app.use("/api/products", productRoutes);             // Module 3: Product Management
app.use("/api/categories", categoryRoutes);          // Module 4a: Category Management
app.use("/api/suppliers", supplierRoutes);            // Module 4b: Supplier Management
app.use("/api/inventory", inventoryRoutes);          // Module 5: Inventory Management
app.use("/api/pos", posRoutes);                      // Module 7: Point of Sale
app.use("/api/reports", reportRoutes);               // Module 9: Reports & Analytics
app.use("/api/predictions", predictionRoutes);       // Module 10: Predictive Stock
app.use("/api/notifications", notificationRoutes);   // Module 11: Notifications
app.use("/api/audit-logs", auditLogRoutes);          // Module 12: Audit Logs
app.use("/api/settings", settingsRoutes);            // Module 13: Settings

// ---------- Error Handling (must be registered LAST) ----------
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
});
