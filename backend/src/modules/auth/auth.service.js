// src/modules/auth/auth.service.js
const bcrypt = require("bcryptjs");
const authRepository = require("./auth.repository");
const { ApiError } = require("../../middleware/errorHandler");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require("../../utils/tokens");
const { REFRESH_TOKEN_TTL_DAYS } = require("../../config/env");

async function issueTokenPair(user, meta = {}) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await authRepository.storeRefreshToken({
    tokenHash: hashToken(refreshToken),
    userId: user.id,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    userAgent: meta.userAgent,
    ip: meta.ip,
  });

  return { accessToken, refreshToken };
}

const authService = {
  async register({ name, email, password }) {
    const existing = await authRepository.findUserByEmail(email);
    if (existing) throw new ApiError(409, "An account with this email already exists");

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await authRepository.createUser({ name, email, password: hashedPassword });
    return user;
  },

  async login({ email, password }, meta) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) throw new ApiError(401, "Invalid email or password");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new ApiError(401, "Invalid email or password");
    if (!user.isActive) throw new ApiError(403, "This account has been deactivated");

    const tokens = await issueTokenPair(user, meta);
    await authRepository.updateLastLogin(user.id);
    return {
      tokens,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  },

  // Refresh token rotation: every refresh invalidates the old token and
  // issues a brand new one. If a revoked token is reused, it's a strong
  // signal of theft — we revoke the entire token family for that user.
  async refresh(rawRefreshToken, meta) {
    if (!rawRefreshToken) throw new ApiError(401, "No refresh token provided");

    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const tokenHash = hashToken(rawRefreshToken);
    const stored = await authRepository.findRefreshToken(tokenHash);

    if (!stored || stored.expiresAt < new Date()) {
      throw new ApiError(401, "Refresh token expired or not found");
    }
    if (stored.revoked) {
      // Reuse of a revoked token = possible theft. Nuke all sessions.
      await authRepository.revokeAllUserTokens(payload.id);
      throw new ApiError(401, "Token reuse detected — all sessions revoked, please log in again");
    }

    const user = await authRepository.findUserById(payload.id);
    if (!user) throw new ApiError(401, "User no longer exists");

    const tokens = await issueTokenPair(user, meta);
    await authRepository.revokeRefreshToken(tokenHash, hashToken(tokens.refreshToken));

    return { tokens, user };
  },

  async logout(rawRefreshToken) {
    if (!rawRefreshToken) return;
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await authRepository.findRefreshToken(tokenHash);
    if (stored) await authRepository.revokeRefreshToken(tokenHash);
  },

  getProfile(userId) {
    return authRepository.findUserById(userId);
  },
};

module.exports = authService;
