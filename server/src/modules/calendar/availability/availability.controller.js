// calendar/availability controller — thin. Reads validated input, delegates to the
// usecase, responds via the shared envelope helpers. No business rules here. The POST
// timezone is read from the query string exactly as legacy did (req.query.timezone).
import { ok, created, deleted } from "../../../shared/http/response.js";
import { calendarMessagesCodes, messagesNames } from "@dms/shared";
import { availabilityUsecase } from "./availability.usecase.js";

const C = calendarMessagesCodes;
const TK = messagesNames.calendarMessages;

export class AvailabilityController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  getAvailableDays = async (req, res) => {
    const data = await this.usecase.getAvailableDays({ query: req.query, authUser: req.auth });
    return ok(res, data, C.AVAILABLE_DAYS_FETCHED, TK);
  };

  getSlots = async (req, res) => {
    const data = await this.usecase.getSlots({ query: req.query, authUser: req.auth });
    return ok(res, data, C.SLOTS_FETCHED, TK);
  };

  createDay = async (req, res) => {
    const data = await this.usecase.createOrUpdateAvailableDay({
      body: req.body,
      timezone: req.query.timezone,
      authUser: req.auth,
    });
    return created(res, data, C.AVAILABLE_DAY_SAVED, TK);
  };

  createMultipleDays = async (req, res) => {
    const data = await this.usecase.createOrUpdateMultipleDays({
      body: req.body,
      timezone: req.query.timezone,
      authUser: req.auth,
    });
    return created(res, data, C.AVAILABLE_DAYS_SAVED, TK);
  };

  deleteDay = async (req, res) => {
    await this.usecase.deleteDay({ dayId: req.params.id });
    return deleted(res, C.AVAILABLE_DAY_DELETED, TK);
  };

  deleteSlot = async (req, res) => {
    await this.usecase.deleteSlot({ slotId: req.params.id });
    return deleted(res, C.SLOT_DELETED, TK);
  };

  getCalendarMonth = async (req, res) => {
    const data = await this.usecase.getCalendarMonth({ query: req.query, authUser: req.auth });
    return ok(res, data, C.CALENDAR_MONTH_FETCHED, TK);
  };

  getRemindersForDay = async (req, res) => {
    const data = await this.usecase.getRemindersForDay({ query: req.query, authUser: req.auth });
    return ok(res, data, C.REMINDERS_FETCHED, TK);
  };
}

export const availabilityController = new AvailabilityController(availabilityUsecase);
