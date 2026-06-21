// src/modules/contact/contact.service.js
const contactRepository = require("./contact.repository");
const { ApiError } = require("../../middleware/errorHandler");

const contactService = {
  submit: (data, userId) => contactRepository.create({ ...data, userId }),

  async list({ page, limit, resolved }) {
    const where = resolved === undefined ? {} : { isResolved: resolved };
    const [total, inquiries] = await contactRepository.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
    });
    return { inquiries, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
  },

  async resolve(id) {
    const existing = await contactRepository.findById(id);
    if (!existing) throw new ApiError(404, "Inquiry not found");
    return contactRepository.resolve(id);
  },
};

module.exports = contactService;
