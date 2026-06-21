// src/utils/tokens.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL_DAYS,
} = require("../config/env");

function signAccessToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

function signRefreshToken(user) {
  return jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, {
    expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`,
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

// We never store the raw refresh token in the DB — only its hash, so a DB
// leak doesn't hand out usable session tokens.
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const REFRESH_COOKIE_NAME = "ce_refresh";

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/api/auth",
  maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
});

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
};
