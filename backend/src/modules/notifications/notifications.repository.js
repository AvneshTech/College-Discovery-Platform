// src/modules/notifications/notifications.repository.js
const prisma = require("../../config/prisma");

const notificationsRepository = {
  create: ({ userId, type, message, link }) =>
    prisma.notification.create({ data: { userId, type, message, link } }),

  findForUser: ({ userId, unreadOnly, skip, take }) =>
    prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),

  countUnread: (userId) => prisma.notification.count({ where: { userId, isRead: false } }),

  markRead: (id, userId) =>
    // Scoped to userId so one user can never mark another user's notification as read.
    prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } }),

  markAllRead: (userId) =>
    prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } }),
};

module.exports = notificationsRepository;
