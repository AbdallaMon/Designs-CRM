import { getData } from "@/app/helpers/functions/getData";
import { AUDIT_LOGS_URL } from "@/features/audit/config/constant.js";
import { AUDIT_FILTER_KEYS } from "@/features/audit/config/filters.js";

// Data-layer service for the /v2/audit-logs admin viewer. Goes through the shared
// `getData` (which adds the /v2 base, cookie auth, token refresh, and unwraps the
// paginated envelope into master's flat `{ data, total, totalPages, page }` shape) —
// no raw fetch / apiClient use in the UI.
//
// The audit backend reads FLAT query params (actorUserId, module, action, entityType,
// entityId, clientLeadId, from, to, page, pageSize) — NOT getData's `filters` JSON blob
// or its `limit`. So the active filters are baked into the request URL here, and the
// page size is passed via `others` as `pageSize=<limit>`. getData still appends its own
// page/limit/filters/search/sort, which the backend safely ignores (Zod `.passthrough()`).
export async function getAuditLogs({ page, limit, filters = {}, setLoading }) {
  const params = new URLSearchParams();
  for (const key of AUDIT_FILTER_KEYS) {
    const value = filters[key];
    if (value === undefined || value === null) continue;
    const str = String(value).trim();
    if (str === "") continue;
    params.append(key, str);
  }
  const qs = params.toString();
  const url = qs ? `${AUDIT_LOGS_URL}?${qs}` : AUDIT_LOGS_URL;

  return getData({
    url,
    setLoading,
    page,
    limit,
    filters: {},
    search: "",
    sort: {},
    others: `pageSize=${limit}`,
  });
}
