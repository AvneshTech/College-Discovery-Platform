"use client";

// app/hooks/useSocket.ts
// ---------------------------------------------------------------------------
// Phase 9 — Realtime. A single shared Socket.io connection for the whole app.
//
// The backend (src/realtime/socket.js) authenticates the handshake via
// `auth.token` (the in-memory access token) and exposes:
//   • room  `discussion:{id}`  — emits `answer:new`     on every new answer
//   • room  `user:{id}`        — emits `notification:new` for the logged-in user
//   • client events: `discussion:join` / `discussion:leave` / `discussion:typing`
//
// We keep ONE module-level socket instance (re-used across components) so the
// notification bell and any open discussion page share the same connection.

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE, getAccessToken } from "../lib/apiClient";

let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(API_BASE, {
      autoConnect: true,
      transports: ["websocket", "polling"],
      auth: { token: getAccessToken() || undefined },
    });
  }
  return sharedSocket;
}

/**
 * Returns the shared socket instance and (re)connects it.
 * Pass the current access token so the handshake is authenticated; when it
 * changes (login/logout/refresh) we update the auth payload and reconnect.
 */
export function useSocket(token?: string | null): Socket {
  const socketRef = useRef<Socket | null>(null);

  if (!socketRef.current) socketRef.current = getSocket();

  useEffect(() => {
    const socket = socketRef.current!;
    // Keep the handshake token fresh so per-user notification rooms work.
    const nextToken = token ?? getAccessToken() ?? undefined;
    socket.auth = { token: nextToken };
    if (!socket.connected) socket.connect();
    // We deliberately DO NOT disconnect on unmount — the connection is shared
    // app-wide (bell + discussion pages). It is cleaned up on logout below.
  }, [token]);

  return socketRef.current;
}

/** Call on logout to tear down the shared connection. */
export function disconnectSocket() {
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }
}
