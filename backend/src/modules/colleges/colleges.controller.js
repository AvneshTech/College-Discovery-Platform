// src/modules/colleges/colleges.controller.js
const collegesService = require("./colleges.service");
const { asyncHandler } = require("../../middleware/errorHandler");
const prisma = require("../../config/prisma");

const collegesController = {
  list: asyncHandler(async (req, res) => {
    const result = await collegesService.list(req.query);
    res.json(result);
  }),

  getById: asyncHandler(async (req, res) => {
    const college = await collegesService.getById(Number(req.params.id));
    res.json(college);
  }),

  create: asyncHandler(async (req, res) => {
    const college = await collegesService.create(req.body, req.user.id);
    res.status(201).json(college);
  }),

  update: asyncHandler(async (req, res) => {
    const college = await collegesService.update(Number(req.params.id), req.body);
    res.json(college);
  }),

  remove: asyncHandler(async (req, res) => {
    await collegesService.remove(Number(req.params.id));
    res.json({ message: "College deleted" });
  }),

  createReview: asyncHandler(async (req, res) => {
    const review = await collegesService.addReview(
      Number(req.params.id),
      req.user.id,
      req.body
    );
    res.status(201).json(review);
  }),

  compare: asyncHandler(async (req, res) => {
    const colleges = await collegesService.compare(req.body.ids);
    res.json(colleges);
  }),

  predict: asyncHandler(async (req, res) => {
    const results = await collegesService.predict(req.body);

    // Persist for the "Predictor Usage" dashboard analytics widget.
    if (req.user) {
      await prisma.predictorRun.create({
        data: {
          userId: req.user.id,
          exam: req.body.exam,
          rank: req.body.rank,
          category: req.body.category,
          branchPref: req.body.branchPreferences?.join(",") || null,
          resultsJson: results.slice(0, 5),
        },
      });
    }

    res.json({ count: results.length, results });
  }),
};

module.exports = collegesController;
