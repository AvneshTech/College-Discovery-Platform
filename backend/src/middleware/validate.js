// src/middleware/validate.js
// Generic Zod validator: pass a schema, get 400 with field-level errors on failure.
// Usage: router.post("/login", validate(loginSchema), authController.login)
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.slice(1).join("."), // drop "body"/"query"/"params" prefix
      message: issue.message,
    }));
    return res.status(400).json({ message: "Validation failed", errors });
  }

  // Replace with parsed (and coerced/sanitized) data
  req.body = result.data.body ?? req.body;
  req.query = result.data.query ?? req.query;
  req.params = result.data.params ?? req.params;
  next();
};

module.exports = validate;
