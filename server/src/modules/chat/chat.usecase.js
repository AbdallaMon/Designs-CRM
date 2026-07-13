import { roomMethods } from "./chat.usecase.rooms.js";
import { messageMethods } from "./chat.usecase.messages.js";
import { memberMethods } from "./chat.usecase.members.js";
import { fileMethods } from "./chat.usecase.files.js";
import { callMethods } from "./chat.usecase.calls.js";
import { realtimeMethods } from "./chat.usecase.realtime.js";

/**
 * ChatUsecase — facade for the chat module's business logic.
 *
 * The methods were split, verbatim and behavior-preserving, into per-concern
 * mixin objects (rooms / messages / members / files / calls / realtime) and are
 * composed back onto this single prototype below. Because every method lands on
 * the same prototype, all `this.emitToAllMembers*` and cross-method calls
 * resolve exactly as they did in the original single file; repository I/O goes
 * through the directly-imported `chatRepository` singleton (no injection).
 * The public shape is unchanged: the same method names/signatures the
 * controller, socket handlers, and tests call.
 */
export class ChatUsecase {}

Object.assign(
  ChatUsecase.prototype,
  roomMethods,
  messageMethods,
  memberMethods,
  fileMethods,
  callMethods,
  realtimeMethods,
);

// Single shared instance — the socket layer, HTTP controller, and client-chat
// surface all import this same singleton. Repository I/O now goes through the
// directly-imported `chatRepository` singleton (no constructor injection).
export const chatUsecase = new ChatUsecase();
