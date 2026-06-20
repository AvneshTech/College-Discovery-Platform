// src/middleware/security.js
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
const { CLIENT_URL, isProd } = require("../config/env");

// Helmet: sane secure HTTP headers (CSP, no-sniff, frameguard, HSTS in prod)
const helmetMiddleware = helmet({
  contentSecurityPolicy: isProd ? undefined : false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

// CORS: only the deployed frontend origin, credentials enabled for refresh-token cookie
const corsMiddleware = cors({
  origin: CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
});

// Global rate limiter — generous, just stops abuse/scraping
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Tight limiter for auth endpoints — stops credential stuffing / brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth attempts, please try again in 15 minutes." },
});

// HTTP Parameter Pollution guard (?role=admin&role=student style attacks)
const hppMiddleware = hpp();

module.exports = { helmetMiddleware, corsMiddleware, globalLimiter, authLimiter, hppMiddleware };
