// src/middleware/errorHandler.js
//
// Centralized error handling. Every controller is wrapped in asyncHandler
// (see src/utils/asyncHandler.js), so any thrown error — whether it's our
// own ApiError or an unexpected crash — ends up here instead of leaking
// a raw stack trace to the client or crashing the server.

/**
 * 404 handler — runs when no route matched the request at all.
 * Must be registered AFTER all real routes in server.js.
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Global error handler — must be registered LAST in server.js
 * (Express identifies error-handling middleware by its 4-argument signature).
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  // Log full detail on the server for debugging (never sent to the client)
  if (!isOperational) {
    console.error("🔥 Unexpected error:", err);
  } else {
    console.warn(`⚠️  ${statusCode} - ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : "Internal server error",
    // Only include validation details for expected/operational errors
    ...(err.details ? { details: err.details } : {}),
    // Only leak stack traces in development, never in production
    ...(process.env.NODE_ENV === "development" && !isOperational
      ? { stack: err.stack }
      : {}),
  });
};
