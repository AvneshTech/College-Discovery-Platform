// src/index.js
// Entry point. The previous version of this file was a ~250-line monolith that
// exposed the OLD API contract (/api/login, /api/profile, /api/saved, ...) and
// hardcoded a fallback JWT secret ("secretkey"). That legacy server is what
// actually ran, which is why the frontend's modern routes (/api/auth/*,
// /api/users/me/*) appeared "mismatched" — they were hitting a server that
// didn't expose them.
//
// It now simply boots the assembled modular app (src/app.js + src/server.js),
// which serves the secure contract the frontend is written against.
require("./server");
