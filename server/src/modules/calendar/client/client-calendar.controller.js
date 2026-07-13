// calendar/client controller — thin. The PUBLIC client booking surface. Token comes from
// the query string (legacy req.query.token); no session is involved. Responds via the shared
// envelope helpers with language-neutral codes.
import { ok } from "../../../shared/http/response.js";
import { calendarMessagesCodes, messagesNames } from "@dms/shared";
import { clientCalendarUsecase } from "./client-calendar.usecase.js";

const TK = messagesNames.calendarMessages;

class ClientCalendarController {
  async getMeetingData(req, res) {
    const data = await clientCalendarUsecase.getMeetingData({ token: req.query.token });
    return ok(res, data, calendarMessagesCodes.MEETING_DATA_FETCHED, TK);
  }

  async getAvailableDays(req, res) {
    const data = await clientCalendarUsecase.getAvailableDays({
      token: req.query.token,
      month: req.query.month,
      timezone: req.query.timezone,
    });
    return ok(res, data, calendarMessagesCodes.AVAILABLE_DAYS_FETCHED, TK);
  }

  async getSlots(req, res) {
    const data = await clientCalendarUsecase.getSlots({
      token: req.query.token,
      date: req.query.date,
      dayId: req.query.dayId,
      timezone: req.query.timezone,
    });
    return ok(res, data, calendarMessagesCodes.SLOTS_FETCHED, TK);
  }

  async getSlotDetails(req, res) {
    const data = await clientCalendarUsecase.getSlotDetails({
      token: req.query.token,
      slotId: req.query.slotId,
      timezone: req.query.timezone,
    });
    return ok(res, data, calendarMessagesCodes.SLOT_DETAILS_FETCHED, TK);
  }

  async bookMeeting(req, res) {
    const data = await clientCalendarUsecase.bookMeeting({ token: req.query.token, body: req.body });
    return ok(res, data, calendarMessagesCodes.MEETING_BOOKED, TK);
  }

  async getTimezones(req, res) {
    const data = clientCalendarUsecase.getTimezones();
    return ok(res, data, calendarMessagesCodes.TIMEZONES_FETCHED, TK);
  }
}

export const clientCalendarController = new ClientCalendarController();
export { ClientCalendarController };
