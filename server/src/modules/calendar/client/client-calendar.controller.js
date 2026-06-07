// calendar/client controller — thin. The PUBLIC client booking surface. Token comes from
// the query string (legacy req.query.token); no session is involved. Responds via the shared
// envelope helpers with language-neutral codes.
import { ok } from "../../../shared/http/response.js";
import { calendarMessagesCodes, messagesNames } from "@dms/shared";
import { clientCalendarUsecase } from "./client-calendar.usecase.js";

const C = calendarMessagesCodes;
const TK = messagesNames.calendarMessages;

export class ClientCalendarController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  meetingData = async (req, res) => {
    const data = await this.usecase.meetingData({ token: req.query.token });
    return ok(res, data, C.MEETING_DATA_FETCHED, TK);
  };

  availableDays = async (req, res) => {
    const data = await this.usecase.availableDays({
      token: req.query.token,
      month: req.query.month,
      timezone: req.query.timezone,
    });
    return ok(res, data, C.AVAILABLE_DAYS_FETCHED, TK);
  };

  slots = async (req, res) => {
    const data = await this.usecase.slots({
      token: req.query.token,
      date: req.query.date,
      dayId: req.query.dayId,
      timezone: req.query.timezone,
    });
    return ok(res, data, C.SLOTS_FETCHED, TK);
  };

  slotDetails = async (req, res) => {
    const data = await this.usecase.slotDetails({
      token: req.query.token,
      slotId: req.query.slotId,
      timezone: req.query.timezone,
    });
    return ok(res, data, C.SLOT_DETAILS_FETCHED, TK);
  };

  book = async (req, res) => {
    const data = await this.usecase.book({ token: req.query.token, body: req.body });
    return ok(res, data, C.MEETING_BOOKED, TK);
  };

  timezones = async (req, res) => {
    const data = this.usecase.timezones();
    return ok(res, data, C.TIMEZONES_FETCHED, TK);
  };
}

export const clientCalendarController = new ClientCalendarController(clientCalendarUsecase);
