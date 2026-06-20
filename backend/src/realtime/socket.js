// src/realtime/socket.js
const jwt = require("jsonwebtoken");
const { JWT_ACCESS_SECRET } = require("../config/env");

// Auth handshake: client connects with `socket.io-client(URL, { auth: { token } })`
function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(); // allow anonymous viewers of public discussion rooms
  try {
    socket.user = jwt.verify(token, JWT_ACCESS_SECRET);
  } catch {
    // invalid token — treat as anonymous rather than hard-failing the connection
  }
  next();
}

function registerSocketHandlers(io) {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    if (socket.user) socket.join(`user:${socket.user.id}`); // personal notification channel

    socket.on("discussion:join", (discussionId) => {
      socket.join(`discussion:${discussionId}`);
    });

    socket.on("discussion:leave", (discussionId) => {
      socket.leave(`discussion:${discussionId}`);
    });

    socket.on("discussion:typing", ({ discussionId, name }) => {
      socket.to(`discussion:${discussionId}`).emit("discussion:typing", { name });
    });
  });
}

// Call from anywhere in the app (e.g. after creating a Notification row)
// to push it live: emitNotification(io, userId, { type, message, link })
function emitNotification(io, userId, payload) {
  io.to(`user:${userId}`).emit("notification:new", payload);
}

module.exports = { registerSocketHandlers, emitNotification };
