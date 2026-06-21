// src/modules/users/users.schema.js
const { z } = require("zod");

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    avatarUrl: z.string().url().optional(),
    avatarPublicId: z.string().max(200).optional(),
    bio: z.string().trim().max(500).optional(),
    preferredBranches: z.array(z.string()).optional(),
    preferredCities: z.array(z.string()).optional(),
    budgetMaxFees: z.coerce.number().int().positive().optional(),
  }),
});

const updateUserRoleSchema = z.object({
  body: z.object({ role: z.enum(["STUDENT", "ADMIN"]) }),
  params: z.object({ id: z.coerce.number().int().positive() }),
});

module.exports = { updateProfileSchema, updateUserRoleSchema };
