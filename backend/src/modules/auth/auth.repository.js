// src/modules/auth/auth.repository.js
// Repository pattern: this is the ONLY file that talks to Prisma for auth.
// Services never import prisma directly — makes the service layer testable
// (mock the repository) and keeps query logic in one place.
const prisma = require("../../config/prisma");

const authRepository = {
  findUserByEmail: (email) => prisma.user.findUnique({ where: { email } }),

  findUserById: (id) =>
    prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true },
    }),

  createUser: ({ name, email, password }) =>
    prisma.user.create({
      data: { name, email, password },
      select: { id: true, name: true, email: true, role: true },
    }),

  storeRefreshToken: ({ tokenHash, userId, expiresAt, userAgent, ip }) =>
    prisma.refreshToken.create({ data: { tokenHash, userId, expiresAt, userAgent, ip } }),

  findRefreshToken: (tokenHash) => prisma.refreshToken.findUnique({ where: { tokenHash } }),

  revokeRefreshToken: (tokenHash, replacedBy = null) =>
    prisma.refreshToken.update({ where: { tokenHash }, data: { revoked: true, replacedBy } }),

  revokeAllUserTokens: (userId) =>
    prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } }),
};

module.exports = authRepository;
