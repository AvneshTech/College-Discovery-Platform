// src/middleware/errorHandler.js

// Wraps async route handlers so thrown errors/rejected promises reach
// the centralized error handler instead of crashing the process or
// needing try/catch boilerplate in every controller.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

class ApiError extends Error {
  constructor(statusCode, message, errors = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

// Express 5-arg error middleware — must be registered last.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  // Known Prisma error codes -> friendly messages
  if (err.code === "P2002") {
    return res.status(409).json({ message: `Duplicate value for: ${err.meta?.target?.join(", ")}` });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ message: "Record not found" });
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json({
    message: err.message || "Internal server error",
    errors: err.errors,
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { asyncHandler, ApiError, errorHandler, notFoundHandler };
