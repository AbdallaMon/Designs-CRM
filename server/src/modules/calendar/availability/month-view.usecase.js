// calendar/availability month-view usecase — orchestration + tz/grouping ONLY (Prisma via
// the availability repo; per-item ISO/HH:mm shaping via calendar.dto). Ported verbatim from
// the legacy getCalendarDataForMonth: same UTC month bounds, same meeting/call where clauses
// (adminId / isSuperSales branches), same day-key grouping and empty-day fill, same error
// wrapping.
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import { availabilityRepository } from "./availability.repo.js";
import { shapeMonthActivity } from "../calendar.dto.js";

dayjs.extend(timezone);
dayjs.extend(utc);

export async function getCalendarDataForMonth(
  {
    year,
    month,
    adminId = null,
    userId = null,
    isSuperSales = false,
    superSalesId = null,
  },
  repo = availabilityRepository,
) {
  try {
    const timezone = "UTC";
    // Create start and end dates using dayjs with timezone
    const startOfMonth = dayjs.tz(
      `${year}-${month.toString().padStart(2, "0")}-01`,
      timezone
    );
    const endOfMonth = startOfMonth.endOf("month");

    // Convert to UTC for database queries
    const startDate = startOfMonth.utc().toDate();
    const endDate = endOfMonth.utc().toDate();

    // Build where clauses
    const meetingWhere = {
      time: {
        gte: startDate,
        lte: endDate,
      },
      ...(userId && {
        clientLead: {
          userId: Number(userId),
        },
      }),
    };

    const callWhere = {
      time: {
        gte: startDate,
        lte: endDate,
      },
      ...(userId && {
        clientLead: {
          userId: Number(userId),
        },
      }),
    };

    if (adminId) {
      meetingWhere.OR = [
        { adminId: Number(adminId) },
        { userId: Number(userId) },
      ];

      callWhere.userId = Number(adminId);
    } else if (isSuperSales) {
      meetingWhere.OR = [
        { adminId: Number(superSalesId) },
        { userId: Number(superSalesId) },
      ];
      callWhere.userId = Number(superSalesId);
    }

    const [meetings, calls] = await Promise.all([
      repo.findMonthMeetings(meetingWhere),
      repo.findMonthCalls(callWhere),
    ]);

    // Group activities by day
    const calendarData = {};

    // Process meetings
    meetings.forEach((meeting) => {
      const meetingTime = dayjs(meeting.time).tz(timezone);
      const dayKey = meetingTime.format("YYYY-MM-DD");

      if (!calendarData[dayKey]) {
        calendarData[dayKey] = {
          date: dayKey,
          meetings: [],
          calls: [],
        };
      }

      calendarData[dayKey].meetings.push(shapeMonthActivity(meeting, meetingTime));
    });

    // Process calls
    calls.forEach((call) => {
      const callTime = dayjs(call.time).tz(timezone);
      const dayKey = callTime.format("YYYY-MM-DD");

      if (!calendarData[dayKey]) {
        calendarData[dayKey] = {
          date: dayKey,
          meetings: [],
          calls: [],
        };
      }

      calendarData[dayKey].calls.push(shapeMonthActivity(call, callTime));
    });

    // Fill in empty days for the month (optional - frontend can handle this)
    const daysInMonth = endOfMonth.date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayKey = startOfMonth.date(day).format("YYYY-MM-DD");
      if (!calendarData[dayKey]) {
        calendarData[dayKey] = {
          date: dayKey,
          meetings: [],
          calls: [],
        };
      }
    }
    return calendarData;
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    throw new Error("Failed to fetch calendar data");
  }
}
