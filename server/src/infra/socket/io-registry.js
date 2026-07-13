// infra/socket/io-registry — leaf holder for the Socket.IO server singleton.
//
// This module imports NOTHING (least of all the chat module), so any usecase can
// `import { getIo }` from here statically WITHOUT forming the socket ↔ chat import
// cycle (infra/socket/index.js → chat.socket.js → chat.usecase.js → chat.usecase.*.js).
// `initSocket` (in ./index.js) calls `setIo` once at startup; consumers call `getIo`
// at request time.

let io = null;

export function setIo(server) {
  io = server;
}

export function getIo() {
  if (!io) throw new Error("Socket.IO not initialised — call initSocket first");
  return io;
}
