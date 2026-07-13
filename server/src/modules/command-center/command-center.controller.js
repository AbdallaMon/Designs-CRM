// command-center controller — thin. Reads the validated query, delegates to the usecase,
// responds via the shared envelope helper. No business rules. The surface is admin-only (the
// `command_center.view` gate lives on the route).
import { ok } from "../../shared/http/response.js";
import { commandCenterMessagesCodes, messagesNames } from "@dms/shared";
import { commandCenterUsecase } from "./command-center.usecase.js";

const TK = messagesNames.commandCenterMessages;

class CommandCenterController {
  // GET /v2/command-center/overview — composite admin cockpit (KPIs, pipeline, capacity,
  // delivery). Read-only; no mutations.
  async getOverview(req, res) {
    const data = await commandCenterUsecase.getOverview({ query: req.query, authUser: req.auth });
    return ok(res, data, commandCenterMessagesCodes.COMMAND_CENTER_FETCHED, TK);
  }
}

export const commandCenterController = new CommandCenterController();
export { CommandCenterController };
