// my-day controller — thin. Delegates to the usecase, responds via the envelope helper.
// The drill-down scope check runs as route middleware (requireSpecialChecker) and stashes
// the verified target on req.scoped — the handler never re-fetches it.
import { ok } from "../../shared/http/response.js";
import { myDayMessagesCodes, messagesNames } from "@dms/shared";
import { myDayUsecase } from "./my-day.usecase.js";

const TK = messagesNames.myDayMessages;

class MyDayController {
  // GET /v2/my-day — the caller's own queue.
  async getMyQueue(req, res) {
    const data = await myDayUsecase.getMyQueue({ authUser: req.auth });
    return ok(res, data, myDayMessagesCodes.MY_DAY_FETCHED, TK);
  }

  // GET /v2/my-day/team — supervisor rollup (domain gating inside the usecase).
  async getTeam(req, res) {
    const data = await myDayUsecase.getTeamOverview({ authUser: req.auth });
    return ok(res, data, myDayMessagesCodes.MY_DAY_TEAM_FETCHED, TK);
  }

  // requireSpecialChecker adapter — MUST throw on denial (AuthMiddleware contract).
  checkTargetScope(req) {
    return myDayUsecase.checkIfUserCanViewMyDayOf({ id: req.params.userId, authUser: req.auth });
  }

  // GET /v2/my-day/users/:userId — drill-down for the scope-checked target (req.scoped).
  async getUserQueue(req, res) {
    const data = await myDayUsecase.getQueueForTarget({ targetUser: req.scoped });
    return ok(res, data, myDayMessagesCodes.MY_DAY_FETCHED, TK);
  }
}

export const myDayController = new MyDayController();
export { MyDayController };
