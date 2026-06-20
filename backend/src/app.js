// src/app.js
// Assembles the Express application from the modular routers + middleware.
// This is the piece that was missing: the modules (auth, colleges, users,
// discussions) were fully written but never mounted, so the only runnable
// entry point was the legacy monolith in the old index.js. This file makes
// the real, secure, modular contract the one that actually runs.
const express = require("express");
const cookieParser = require("cookie-parser");

const {
  helmetMiddleware,
  corsMiddleware,
  globalLimiter,
  hppMiddleware,
} = require("./middleware/security");
const sanitizeBody = require("./middleware/sanitize");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const authRoutes = require("./modules/auth/auth.routes");
const collegesRoutes = require("./modules/colleges/colleges.routes");
const discussionsRoutes = require("./modules/discussions/discussions.routes");
const usersRoutes = require("./modules/users/users.routes");

function createApp() {
  const app = express();

  // Trust the reverse proxy (needed for correct req.ip behind nginx / a PaaS,
  // and for secure cookies to work in production).
  app.set("trust proxy", 1);

  // ── Security & parsing middleware (order matters) ──────────────────────
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser()); // required so req.cookies works for the refresh-token flow
  app.use(hppMiddleware);
  app.use(sanitizeBody); // strip XSS payloads from every string in req.body
  app.use(globalLimiter);

  // ── Health check (used by load balancers / uptime monitors) ───────────
  app.get("/api/health", (_req, res) =>
    res.json({ status: "ok", timestamp: new Date().toISOString() })
  );

  // ── Feature routers ────────────────────────────────────────────────────
  app.use("/api/auth", authRoutes);
  app.use("/api/colleges", collegesRoutes);
  app.use("/api/discussions", discussionsRoutes);
  app.use("/api/users", usersRoutes);

  // ── 404 + centralized error handler (must be registered last) ──────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
