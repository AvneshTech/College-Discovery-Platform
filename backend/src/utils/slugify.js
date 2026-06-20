// src/utils/slugify.js
function base(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Appends -2, -3, ... until findExisting returns null. `findExisting` is an
// injected async function so this utility has zero direct DB dependency.
async function unique(text, findExisting) {
  const slugBase = base(text);
  let candidate = slugBase;
  let n = 2;
  while (await findExisting(candidate)) {
    candidate = `${slugBase}-${n}`;
    n += 1;
  }
  return candidate;
}

module.exports = { base, unique };
