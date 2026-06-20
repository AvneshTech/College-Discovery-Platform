// src/modules/discussions/discussions.routes.js
const router = require("express").Router();
const { z } = require("zod");
const prisma = require("../../config/prisma");
const { asyncHandler } = require("../../middleware/errorHandler");
const { authMiddleware, requireRole } = require("../../middleware/auth");
const validate = require("../../middleware/validate");

const createDiscussionSchema = z.object({
  body: z.object({ title: z.string().trim().min(5).max(150), body: z.string().trim().min(10).max(5000) }),
});
const createAnswerSchema = z.object({
  body: z.object({ body: z.string().trim().min(1).max(2000) }),
  params: z.object({ id: z.coerce.number().int().positive() }),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const discussions = await prisma.discussion.findMany({
      where: { status: { not: "FLAGGED" } },
      include: { author: { select: { id: true, name: true } }, _count: { select: { answers: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(discussions);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const discussion = await prisma.discussion.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        author: { select: { id: true, name: true } },
        answers: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      },
    });
    if (!discussion) return res.status(404).json({ message: "Discussion not found" });
    res.json(discussion);
  })
);

router.post(
  "/",
  authMiddleware,
  validate(createDiscussionSchema),
  asyncHandler(async (req, res) => {
    const discussion = await prisma.discussion.create({
      data: { title: req.body.title, body: req.body.body, authorId: req.user.id },
      include: { author: { select: { id: true, name: true } } },
    });
    res.status(201).json(discussion);
  })
);

// Real-time reply: persists the answer, then broadcasts it over the
// `discussion:{id}` Socket.io room (see src/realtime/socket.js).
router.post(
  "/:id/answers",
  authMiddleware,
  validate(createAnswerSchema),
  asyncHandler(async (req, res) => {
    const discussionId = Number(req.params.id);
    const answer = await prisma.answer.create({
      data: { body: req.body.body, authorId: req.user.id, discussionId },
      include: { author: { select: { id: true, name: true } } },
    });

    const io = req.app.get("io");
    io?.to(`discussion:${discussionId}`).emit("answer:new", answer);

    res.status(201).json(answer);
  })
);

// Admin moderation
router.patch(
  "/:id/flag",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const discussion = await prisma.discussion.update({
      where: { id: Number(req.params.id) },
      data: { status: "FLAGGED" },
    });
    res.json(discussion);
  })
);

module.exports = router;
