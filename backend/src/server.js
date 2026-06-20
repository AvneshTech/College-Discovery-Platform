// src/server.js
// Boots the HTTP server + Socket.io realtime layer and wires them together.
// `app.set("io", io)` is what makes `req.app.get("io")` work inside
// discussions.routes.js (the realtime reply broadcast) — without this, that
// call silently no-ops.
const http = require("http");
const { Server } = require("socket.io");

// env.js validates required env vars at import time and exits if any are missing.
const { PORT, CLIENT_URL, NODE_ENV } = require("./config/env");
const { createApp } = require("./app");
const prisma = require("./config/prisma");
const { registerSocketHandlers } = require("./realtime/socket");

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: CLIENT_URL, credentials: true },
});

// Expose io to route handlers via req.app.get("io")
app.set("io", io);
registerSocketHandlers(io);

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
});

// ── Graceful shutdown: stop accepting connections, close Prisma pool ──────
async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received — shutting down gracefully...`);
  io.close();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Force-exit if something hangs
  setTimeout(() => process.exit(1), 10000).unref();
}

["SIGINT", "SIGTERM"].forEach((sig) => process.on(sig, () => shutdown(sig)));

// Don't leave the process in an undefined state on an unhandled rejection.
process.on("unhandledRejection", (reason) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled promise rejection:", reason);
});

module.exports = { app, server, io };
