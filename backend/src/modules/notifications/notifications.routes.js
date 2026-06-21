// src/modules/notifications/notifications.routes.js
const router = require("express").Router();
const { z } = require("zod");
const notificationsController = require("./notifications.controller");
const validate = require("../../middleware/validate");
const { authMiddleware } = require("../../middleware/auth");

const listQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    unreadOnly: z.coerce.boolean().optional().default(false),
  }),
});

router.get("/", authMiddleware, validate(listQuerySchema), notificationsController.list);
router.patch("/read-all", authMiddleware, notificationsController.markAllRead);
router.patch("/:id/read", authMiddleware, notificationsController.markRead);

module.exports = router;
