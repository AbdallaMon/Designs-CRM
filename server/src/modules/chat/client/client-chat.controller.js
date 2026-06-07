// chat/client controller — thin. The PUBLIC client-chat surface (token-based, NO
// session). The token comes from the query string; the roomId from the path param.
// All authority/IDOR checks live in the usecase (resolveRoom). Responds via the
// shared envelope helpers with language-neutral codes.
import { ok } from "../../../shared/http/response.js";
import { chatMessagesCodes, messagesNames } from "@dms/shared";
import { clientChatUsecase } from "./client-chat.usecase.js";

const C = chatMessagesCodes;
const TK = messagesNames.chatMessages;

export class ClientChatController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  validateToken = async (req, res) => {
    const data = await this.usecase.validateToken({ token: req.query.token });
    return ok(res, data, C.ROOM_TOKEN_VALIDATED, TK);
  };

  getRoom = async (req, res) => {
    const data = await this.usecase.getRoom({
      token: req.query.token,
      roomId: req.params.roomId,
    });
    return ok(res, data, C.ROOM_FETCHED, TK);
  };

  getMessages = async (req, res) => {
    const data = await this.usecase.getMessages({
      token: req.query.token,
      roomId: req.params.roomId,
      page: req.query.page,
      limit: req.query.limit,
    });
    return ok(res, data, C.MESSAGES_FETCHED, TK);
  };

  getMessagePage = async (req, res) => {
    const data = await this.usecase.getMessagePage({
      token: req.query.token,
      roomId: req.params.roomId,
      messageId: req.params.messageId,
      limit: req.query.limit,
    });
    return ok(res, data, C.MESSAGE_PAGE_FETCHED, TK);
  };

  getPinnedMessages = async (req, res) => {
    const data = await this.usecase.getPinnedMessages({
      token: req.query.token,
      roomId: req.params.roomId,
    });
    return ok(res, data, C.PINNED_MESSAGES_FETCHED, TK);
  };

  getMembers = async (req, res) => {
    const data = await this.usecase.getMembers({
      token: req.query.token,
      roomId: req.params.roomId,
    });
    return ok(res, data, C.MEMBERS_FETCHED, TK);
  };

  getFiles = async (req, res) => {
    const data = await this.usecase.getFiles({
      token: req.query.token,
      roomId: req.params.roomId,
      query: req.query,
    });
    return ok(res, data, C.FILES_FETCHED, TK);
  };
}

export const clientChatController = new ClientChatController(clientChatUsecase);
