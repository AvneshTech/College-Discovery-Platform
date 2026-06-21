// src/modules/discussions/discussions.routes.js
const router = require("express").Router();
const { z } = require("zod");
const prisma = require("../../config/prisma");
const { asyncHandler } = require("../../middleware/errorHandler");
const { authMiddleware, requireRole } = require("../../middleware/auth");
const validate = require("../../middleware/validate");
const notificationsService = require("../notifications/notifications.service");

const createDiscussionSchema = z.object({
  body: z.object({
    title: z.string().trim().min(5).max(150),
    body: z.string().trim().min(10).max(5000),
    tags: z.array(z.string().trim().max(30)).max(10).optional().default([]),
  }),
});
const createAnswerSchema = z.object({
  body: z.object({ body: z.string().trim().min(1).max(2000) }),
  params: z.object({ id: z.coerce.number().int().positive() }),
});
const listQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    tag: z.string().trim().max(30).optional(),
    sortBy: z.enum(["recent", "trending", "popular"]).default("recent"),
  }),
});

// recent = newest first; trending/popular = most viewed first (with a
// recency tiebreak), useful for a "Popular Discussions" widget.
function orderByFor(sortBy) {
  if (sortBy === "trending" || sortBy === "popular") return [{ viewsCount: "desc" }, { createdAt: "desc" }];
  return { createdAt: "desc" };
}

router.get(
  "/",
  validate(listQuerySchema),
  asyncHandler(async (req, res) => {
    const { page, limit, tag, sortBy } = req.query;
    const where = { status: { not: "FLAGGED" }, ...(tag ? { tags: { has: tag } } : {}) };

    const [total, discussions] = await Promise.all([
      prisma.discussion.count({ where }),
      prisma.discussion.findMany({
        where,
        include: { author: { select: { id: true, name: true } }, _count: { select: { answers: true } } },
        orderBy: orderByFor(sortBy),
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({ discussions, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const discussion = await prisma.discussion.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
      include: {
        author: { select: { id: true, name: true } },
        answers: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      },
    }).catch(() => null); // P2025 (not found) -> null, handled below

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
      data: { title: req.body.title, body: req.body.body, tags: req.body.tags, authorId: req.user.id },
      include: { author: { select: { id: true, name: true } } },
    });
    res.status(201).json(discussion);
  })
);

// Real-time reply: persists the answer, broadcasts it over the
// `discussion:{id}` Socket.io room, and notifies the discussion author
// (unless they're replying to their own thread).
router.post(
  "/:id/answers",
  authMiddleware,
  validate(createAnswerSchema),
  asyncHandler(async (req, res) => {
    const discussionId = Number(req.params.id);
    const discussion = await prisma.discussion.findUnique({ where: { id: discussionId } });
    if (!discussion) return res.status(404).json({ message: "Discussion not found" });

    const answer = await prisma.answer.create({
      data: { body: req.body.body, authorId: req.user.id, discussionId },
      include: { author: { select: { id: true, name: true } } },
    });

    const io = req.app.get("io");
    io?.to(`discussion:${discussionId}`).emit("answer:new", answer);

    if (discussion.authorId !== req.user.id) {
      await notificationsService.notify(io, {
        userId: discussion.authorId,
        type: "REPLY",
        message: `${answer.author.name} replied to your discussion "${discussion.title}"`,
        link: `/discussions/${discussionId}`,
      });
    }

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
