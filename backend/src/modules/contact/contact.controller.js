// src/modules/contact/contact.controller.js
const contactService = require("./contact.service");
const { asyncHandler } = require("../../middleware/errorHandler");

const contactController = {
  submit: asyncHandler(async (req, res) => {
    const inquiry = await contactService.submit(req.body, req.user?.id);
    res.status(201).json({ message: "Thanks — we'll be in touch shortly.", inquiry });
  }),

  list: asyncHandler(async (req, res) => {
    const result = await contactService.list(req.query);
    res.json(result);
  }),

  resolve: asyncHandler(async (req, res) => {
    const inquiry = await contactService.resolve(Number(req.params.id));
    res.json(inquiry);
  }),
};

module.exports = contactController;
