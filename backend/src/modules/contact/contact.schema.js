// src/modules/contact/contact.schema.js
const { z } = require("zod");

const createInquirySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email(),
    subject: z.string().trim().min(3).max(150),
    message: z.string().trim().min(10).max(3000),
  }),
});

const listQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    resolved: z.coerce.boolean().optional(),
  }),
});

module.exports = { createInquirySchema, listQuerySchema };
