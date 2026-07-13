// calendar/availability controller — thin. Reads validated input, delegates to the
// usecase, responds via the shared envelope helpers. No business rules here. The POST
// timezone is read from the query string exactly as legacy did (req.query.timezone).
import { ok, created, deleted } from "../../../shared/http/response.js";
import { calendarMessagesCodes, messagesNames } from "@dms/shared";
import { availabilityUsecase } from "./availability.usecase.js";

const TK = messagesNames.calendarMessages;

class AvailabilityController {
  async getAvailableDays(req, res) {
    const data = await availabilityUsecase.getAvailableDays({ query: req.query, authUser: req.auth });
    return ok(res, data, calendarMessagesCodes.AVAILABLE_DAYS_FETCHED, TK);
  }

  async getSlots(req, res) {
    const data = await availabilityUsecase.getSlots({ query: req.query, authUser: req.auth });
    return ok(res, data, calendarMessagesCodes.SLOTS_FETCHED, TK);
  }

  async createDay(req, res) {
    const data = await availabilityUsecase.createOrUpdateAvailableDay({
      body: req.body,
      timezone: req.query.timezone,
      authUser: req.auth,
    });
    return created(res, data, calendarMessagesCodes.AVAILABLE_DAY_SAVED, TK);
  }

  async createMultipleDays(req, res) {
    const data = await availabilityUsecase.createOrUpdateMultipleDays({
      body: req.body,
      timezone: req.query.timezone,
      authUser: req.auth,
    });
    return created(res, data, calendarMessagesCodes.AVAILABLE_DAYS_SAVED, TK);
  }

  async addCustomSlot(req, res) {
    const data = await availabilityUsecase.addCustomSlot({
      dayId: req.params.dayId,
      body: req.body,
      timezone: req.query.timezone,
      authUser: req.auth,
    });
    return created(res, data, calendarMessagesCodes.CUSTOM_SLOT_ADDED, TK);
  }

  async deleteDay(req, res) {
    await availabilityUsecase.deleteDay({ dayId: req.params.id });
    return deleted(res, calendarMessagesCodes.AVAILABLE_DAY_DELETED, TK);
  }

  async deleteSlot(req, res) {
    await availabilityUsecase.deleteSlot({ slotId: req.params.id });
    return deleted(res, calendarMessagesCodes.SLOT_DELETED, TK);
  }

  async getCalendarMonth(req, res) {
    const data = await availabilityUsecase.getCalendarMonth({ query: req.query, authUser: req.auth });
    return ok(res, data, calendarMessagesCodes.CALENDAR_MONTH_FETCHED, TK);
  }

  async getRemindersForDay(req, res) {
    const data = await availabilityUsecase.getRemindersForDay({ query: req.query, authUser: req.auth });
    return ok(res, data, calendarMessagesCodes.REMINDERS_FETCHED, TK);
  }
}

export const availabilityController = new AvailabilityController();
export { AvailabilityController };
