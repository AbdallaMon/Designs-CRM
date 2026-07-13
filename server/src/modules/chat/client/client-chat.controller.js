// chat/client controller — thin. The PUBLIC client-chat surface (token-based, NO
// session). The token comes from the query string; the roomId from the path param.
// All authority/IDOR checks live in the usecase (resolveRoom). Responds via the
// shared envelope helpers with language-neutral codes.
import { ok } from "../../../shared/http/response.js";
import { chatMessagesCodes, messagesNames } from "@dms/shared";
import { clientChatUsecase } from "./client-chat.usecase.js";

const TK = messagesNames.chatMessages;

class ClientChatController {
  async validateToken(req, res) {
    const data = await clientChatUsecase.validateToken({ token: req.query.token });
    return ok(res, data, chatMessagesCodes.ROOM_TOKEN_VALIDATED, TK);
  }

  async getRoom(req, res) {
    const data = await clientChatUsecase.getRoom({
      token: req.query.token,
      roomId: req.params.roomId,
    });
    return ok(res, data, chatMessagesCodes.ROOM_FETCHED, TK);
  }

  async getMessages(req, res) {
    const data = await clientChatUsecase.getMessages({
      token: req.query.token,
      roomId: req.params.roomId,
      page: req.query.page,
      limit: req.query.limit,
    });
    return ok(res, data, chatMessagesCodes.MESSAGES_FETCHED, TK);
  }

  async getMessagePage(req, res) {
    const data = await clientChatUsecase.getMessagePage({
      token: req.query.token,
      roomId: req.params.roomId,
      messageId: req.params.messageId,
      limit: req.query.limit,
    });
    return ok(res, data, chatMessagesCodes.MESSAGE_PAGE_FETCHED, TK);
  }

  async getPinnedMessages(req, res) {
    const data = await clientChatUsecase.getPinnedMessages({
      token: req.query.token,
      roomId: req.params.roomId,
    });
    return ok(res, data, chatMessagesCodes.PINNED_MESSAGES_FETCHED, TK);
  }

  async getMembers(req, res) {
    const data = await clientChatUsecase.getMembers({
      token: req.query.token,
      roomId: req.params.roomId,
    });
    return ok(res, data, chatMessagesCodes.MEMBERS_FETCHED, TK);
  }

  async getFiles(req, res) {
    const data = await clientChatUsecase.getFiles({
      token: req.query.token,
      roomId: req.params.roomId,
      query: req.query,
    });
    return ok(res, data, chatMessagesCodes.FILES_FETCHED, TK);
  }
}

export const clientChatController = new ClientChatController();
export { ClientChatController };
