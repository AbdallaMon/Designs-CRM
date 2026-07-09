// dashboard filters/shaping helpers — pure functions extracted verbatim from the legacy
// `dashboard-services.js` private helpers. NO Prisma, NO side effects: they only build the
// `where`/date-range fragments the dashboard usecase feeds to the repository. Behavior is
// preserved 1:1 (including the historical call shape where `updateKeyFilterForUserFilter`
// ignores its first argument).
import dayjs from "dayjs";

export async function updateKeyFilterForUserFilter(
  userFilter,
  searchParams,
  key = "staffId"
) {
  const filterKey = key === "staffId" ? "userId" : key;
  userFilter = { [filterKey]: Number(searchParams[key]) };
  return userFilter;
}

export function buildDateRange(q) {
  const start = q?.startDate
    ? dayjs(q.startDate).startOf("day")
    : dayjs().startOf("month");
  const end = q?.endDate ? dayjs(q.endDate).endOf("day") : dayjs().endOf("day");
  return {
    start: start.toDate(),
    end: end.toDate(),
    label: `${start.format("MMM D, YYYY")} → ${end.format("MMM D, YYYY")}`,
  };
}

export function buildStaffFilter(q) {
  const staffId = Number(q?.staffId);
  if (Number.isFinite(staffId)) return { userId: staffId };
  return {};
}
