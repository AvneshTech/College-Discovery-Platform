// src/modules/users/users.routes.js
const router = require("express").Router();
const prisma = require("../../config/prisma");
const { asyncHandler, ApiError } = require("../../middleware/errorHandler");
const { authMiddleware, requireRole } = require("../../middleware/auth");
const validate = require("../../middleware/validate");
const { updateProfileSchema, updateUserRoleSchema } = require("./users.schema");

// ── Self-service ───────────────────────────────────────────────────────
router.get(
  "/me/saved",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const saved = await prisma.savedCollege.findMany({
      where: { userId: req.user.id },
      include: { college: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(saved.map((s) => s.college));
  })
);

router.post(
  "/me/saved/:collegeId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const collegeId = Number(req.params.collegeId);
    await prisma.savedCollege.upsert({
      where: { userId_collegeId: { userId: req.user.id, collegeId } },
      create: { userId: req.user.id, collegeId },
      update: {},
    });
    res.status(201).json({ message: "Saved" });
  })
);

router.delete(
  "/me/saved/:collegeId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    await prisma.savedCollege.deleteMany({
      where: { userId: req.user.id, collegeId: Number(req.params.collegeId) },
    });
    res.json({ message: "Removed" });
  })
);

router.put(
  "/me",
  authMiddleware,
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: req.body,
      select: { id: true, name: true, email: true, avatarUrl: true, preferredBranches: true, preferredCities: true, budgetMaxFees: true },
    });
    res.json(user);
  })
);

// "Predictor Usage" + "Discussion Activity" dashboard analytics
router.get(
  "/me/dashboard",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const [savedCount, predictorRuns, discussionCount, answerCount, recentPredictor] = await Promise.all([
      prisma.savedCollege.count({ where: { userId } }),
      prisma.predictorRun.count({ where: { userId } }),
      prisma.discussion.count({ where: { authorId: userId } }),
      prisma.answer.count({ where: { authorId: userId } }),
      prisma.predictorRun.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    ]);
    res.json({
      savedCount,
      predictorRuns,
      discussionCount,
      answerCount,
      recommendedColleges: recentPredictor?.resultsJson ?? [],
    });
  })
);

// ── Admin-only user management (RBAC) ───────────────────────────────────
router.get(
  "/",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  })
);

router.patch(
  "/:id/role",
  authMiddleware,
  requireRole("ADMIN"),
  validate(updateUserRoleSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { role: req.body.role },
      select: { id: true, name: true, role: true },
    });
    res.json(user);
  })
);

router.patch(
  "/:id/deactivate",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (id === req.user.id) throw new ApiError(400, "You cannot deactivate your own account");
    const user = await prisma.user.update({ where: { id }, data: { isActive: false } });
    res.json({ message: "User deactivated", id: user.id });
  })
);

module.exports = router;
