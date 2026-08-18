import { getPropertyValue } from "@/app/helpers/functions/utility";
import { LEAD_STATUSES } from "@dms/shared";

export function uniqueSearchResults(items) {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter((item) => {
    const key = item?.id == null ? null : String(item.id);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getNewLeadSearchHref(option, resource) {
  if (
    resource !== "leads" ||
    option?.status !== LEAD_STATUSES.NEW ||
    option?.id == null
  ) {
    return null;
  }
  return `/dashboard/deals/${option.id}`;
}

export function formatSearchOption(option, resource, renderKeys = []) {
  if (resource === "leads") {
    const identity = [
      option?.id == null ? null : String(option.id).padStart(7, "0"),
      option?.code ? `code ${option.code}` : null,
    ];
    const details = renderKeys
      .filter((key) => key !== "id" && key !== "code")
      .map((key) => getPropertyValue(option, key));
    return [...identity, ...details]
      .filter((value) => value !== null && value !== undefined && value !== "")
      .join(" - ");
  }

  return renderKeys
    .map((key) => getPropertyValue(option, key))
    .filter((value) => value !== null && value !== undefined && value !== "")
    .join(" - ");
}
