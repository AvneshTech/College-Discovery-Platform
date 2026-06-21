// src/modules/notifications/notifications.controller.js
const notificationsService = require("./notifications.service");
const { asyncHandler } = require("../../middleware/errorHandler");

const notificationsController = {
  list: asyncHandler(async (req, res) => {
    const result = await notificationsService.list(req.user.id, req.query);
    res.json(result);
  }),

  markRead: asyncHandler(async (req, res) => {
    const result = await notificationsService.markRead(Number(req.params.id), req.user.id);
    res.json(result);
  }),

  markAllRead: asyncHandler(async (req, res) => {
    const result = await notificationsService.markAllRead(req.user.id);
    res.json(result);
  }),
};

module.exports = notificationsController;
