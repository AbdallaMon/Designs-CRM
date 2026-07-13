import { AppError } from "../../shared/errors/AppError.js";
import { addMonthGrouping } from "./chat.helpers.js";
import { chatMessagesCodes } from "@dms/shared";
import { chatRepository } from "./chat.repo.js";

/**
 * Files concern of ChatUsecase — file gallery listing and stats. Prototype-
 * composed onto {@link ChatUsecase} (see chat.usecase.js); moved verbatim,
 * behavior-preserving only.
 */
export const fileMethods = {
  // ── Files ──────────────────────────────────────────────────────────────────

  async getFiles(roomId, userId, clientId, query) {
    const { page, limit, sort, type, search, from, to, uniqueMonths } = query;

    const member = await chatRepository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member)
      throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    const parsedUniqueMonths = uniqueMonths ? JSON.parse(uniqueMonths) : {};

    const {
      attachments,
      total,
      limit: parsedLimit,
      page: parsedPage,
    } = await chatRepository.getFiles({
      roomId,
      page: page ? Number(page) : 0,
      limit: limit ? Number(limit) : 20,
      sort: sort || "newest",
      type: type || null,
      search: search || "",
      from: from || null,
      to: to || null,
    });

    const formattedFiles = addMonthGrouping(attachments, parsedUniqueMonths);

    return {
      items: formattedFiles,
      total,
      page: parsedPage,
      pageSize: parsedLimit,
      // Domain-specific extra the FE file gallery needs (month dividers); kept
      // alongside the normalized list envelope.
      uniqueMonths: parsedUniqueMonths,
    };
  },

  async getFileStats(roomId, userId, clientId) {
    const member = await chatRepository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member)
      throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);
    return chatRepository.getFileStats(roomId);
  },
};
