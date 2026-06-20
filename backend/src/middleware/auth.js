// src/middleware/auth.js
const jwt = require("jsonwebtoken");
const { JWT_ACCESS_SECRET } = require("../config/env");

// Verifies the short-lived access token sent as "Authorization: Bearer <token>".
// Does NOT touch the database — keeps auth checks O(1) and fast.
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: no token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
}

// Doesn't fail if missing — useful for endpoints that behave differently
// for logged-in vs anonymous users (e.g. showing "saved" state on colleges).
function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(authHeader.split(" ")[1], JWT_ACCESS_SECRET);
    } catch {
      // ignore — treat as anonymous
    }
  }
  next();
}

// Role-Based Access Control — usage: requireRole("ADMIN")
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }
    next();
  };
}

module.exports = { authMiddleware, optionalAuth, requireRole };
