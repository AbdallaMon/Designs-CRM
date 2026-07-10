// command-center controller — thin. Reads the validated query, delegates to the usecase,
// responds via the shared envelope helper. No business rules. The surface is admin-only (the
// `command_center.view` gate lives on the route).
import { ok } from "../../shared/http/response.js";
import { commandCenterMessagesCodes, messagesNames } from "@dms/shared";
import { commandCenterUsecase } from "./command-center.usecase.js";

const C = commandCenterMessagesCodes;
const TK = messagesNames.commandCenterMessages;

export class CommandCenterController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  // GET /v2/command-center/overview — composite admin cockpit (KPIs, pipeline, capacity,
  // delivery). Read-only; no mutations.
  overview = async (req, res) => {
    const data = await this.usecase.getOverview({ query: req.query, authUser: req.auth });
    return ok(res, data, C.COMMAND_CENTER_FETCHED, TK);
  };
}

export const commandCenterController = new CommandCenterController(commandCenterUsecase);
