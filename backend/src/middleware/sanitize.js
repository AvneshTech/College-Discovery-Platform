// src/middleware/sanitize.js
// Strips XSS payloads out of every string field in req.body before it ever
// reaches a controller — defense in depth on top of React's own escaping.
const xss = require("xss");

function deepSanitize(value) {
  if (typeof value === "string") return xss(value);
  if (Array.isArray(value)) return value.map(deepSanitize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, deepSanitize(v)])
    );
  }
  return value;
}

function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = deepSanitize(req.body);
  }
  next();
}

module.exports = sanitizeBody;
