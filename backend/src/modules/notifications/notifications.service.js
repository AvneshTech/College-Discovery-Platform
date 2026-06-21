// src/modules/notifications/notifications.service.js
const notificationsRepository = require("./notifications.repository");
const { ApiError } = require("../../middleware/errorHandler");
const { emitNotification } = require("../../realtime/socket");

const notificationsService = {
  // Called from other modules (discussions answers, deadline reminders, etc.)
  // Persists the notification AND pushes it live over the user's personal
  // Socket.io room (see realtime/socket.js — `user:${userId}`).
  async notify(io, { userId, type, message, link }) {
    const notification = await notificationsRepository.create({ userId, type, message, link });
    if (io) emitNotification(io, userId, notification);
    return notification;
  },

  async list(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const skip = (page - 1) * limit;
    const [items, unreadCount] = await Promise.all([
      notificationsRepository.findForUser({ userId, unreadOnly, skip, take: limit }),
      notificationsRepository.countUnread(userId),
    ]);
    return { items, unreadCount, page, limit };
  },

  async markRead(id, userId) {
    const { count } = await notificationsRepository.markRead(id, userId);
    if (count === 0) throw new ApiError(404, "Notification not found");
    return { message: "Marked as read" };
  },

  async markAllRead(userId) {
    await notificationsRepository.markAllRead(userId);
    return { message: "All notifications marked as read" };
  },
};

module.exports = notificationsService;
