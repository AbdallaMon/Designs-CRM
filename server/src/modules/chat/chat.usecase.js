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
 * the same prototype, all `this.repository` / `this.emitToAllMembers*` and
 * cross-method calls resolve exactly as they did in the original single file.
 * The public shape is unchanged: `new ChatUsecase(repository)` with the same
 * method names/signatures the controller, socket handlers, and tests call.
 */
export class ChatUsecase {
  /** @param {import("./chat.repo.js").ChatRepository} repository */
  constructor(repository) {
    this.repository = repository;
  }
}

Object.assign(
  ChatUsecase.prototype,
  roomMethods,
  messageMethods,
  memberMethods,
  fileMethods,
  callMethods,
  realtimeMethods,
);
