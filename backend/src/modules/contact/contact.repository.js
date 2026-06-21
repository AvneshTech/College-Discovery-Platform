// src/modules/contact/contact.repository.js
const prisma = require("../../config/prisma");

const contactRepository = {
  create: ({ name, email, subject, message, userId }) =>
    prisma.contactInquiry.create({ data: { name, email, subject, message, userId: userId ?? null } }),

  findMany: ({ where, skip, take }) =>
    Promise.all([
      prisma.contactInquiry.count({ where }),
      prisma.contactInquiry.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    ]),

  findById: (id) => prisma.contactInquiry.findUnique({ where: { id } }),

  resolve: (id) => prisma.contactInquiry.update({ where: { id }, data: { isResolved: true } }),
};

module.exports = contactRepository;
