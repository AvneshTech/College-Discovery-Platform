// src/modules/colleges/colleges.schema.js
const { z } = require("zod");

const listQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(9),
    search: z.string().trim().max(100).optional(),
    city: z.string().trim().max(100).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    maxFees: z.coerce.number().int().positive().optional(),
    branch: z.string().trim().max(50).optional(),
    sortBy: z.enum(["rating", "fees", "nirfRank", "avgPackage"]).default("rating"),
  }),
});

const createCollegeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(150),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().max(80).optional(),
    type: z.string().trim().max(40).optional(),
    logoUrl: z.string().url().optional(),
    bannerUrl: z.string().url().optional(),
    nirfRank: z.coerce.number().int().positive().optional(),
    naacGrade: z.string().max(5).optional(),
    fees: z.coerce.number().int().nonnegative().optional(),
    avgPackage: z.coerce.number().int().nonnegative().optional(),
    highestPackage: z.coerce.number().int().nonnegative().optional(),
    placementRate: z.coerce.number().min(0).max(100).optional(),
    courses: z.array(z.string()).optional(),
    branches: z.array(z.string()).optional(),
    overview: z.string().max(5000).optional(),
    website: z.string().url().optional(),
    established: z.coerce.number().int().min(1700).max(2100).optional(),
  }),
});

const updateCollegeSchema = z.object({
  body: createCollegeSchema.shape.body.partial(),
  params: z.object({ id: z.coerce.number().int().positive() }),
});

const createReviewSchema = z.object({
  body: z.object({
    rating: z.coerce.number().min(1).max(5),
    title: z.string().trim().max(120).optional(),
    body: z.string().trim().min(5, "Review must be at least 5 characters").max(3000),
  }),
  params: z.object({ id: z.coerce.number().int().positive() }),
});

const compareSchema = z.object({
  body: z.object({
    ids: z.array(z.coerce.number().int().positive()).min(2).max(4),
  }),
});

const predictorSchema = z.object({
  body: z.object({
    exam: z.enum(["JEE Main", "JEE Advanced", "BITSAT", "State CET"]),
    rank: z.coerce.number().int().positive(),
    category: z.enum(["General", "OBC", "SC", "ST", "EWS"]).default("General"),
    branchPreferences: z.array(z.string()).optional().default([]),
    cityPreferences: z.array(z.string()).optional().default([]),
    maxBudget: z.coerce.number().int().positive().optional(),
  }),
});

module.exports = {
  listQuerySchema,
  createCollegeSchema,
  updateCollegeSchema,
  compareSchema,
  predictorSchema,
  createReviewSchema,
};
