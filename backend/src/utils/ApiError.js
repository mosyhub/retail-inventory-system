// src/utils/ApiError.js
//
// A custom Error class so controllers can throw errors with an intentional
// HTTP status code attached, e.g.:
//
//   throw new ApiError(404, "Product not found");
//
// This gets caught by our centralized error handler middleware (see
// src/middleware/errorHandler.js) and turned into a consistent JSON response.

class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details; // optional extra info (e.g. validation error array)
    this.isOperational = true; // distinguishes "expected" errors from bugs/crashes

    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
