// Default list pagination: page=1, limit=10.
// Extracted verbatim from the identical per-controller copies (the legacy
// services/main/utility getPagination default) into a single shared helper.
// NOTE: the courses controllers use a different variant (query.page ?? 1 + a
// `take` field) and intentionally keep their own local paginate.
export function paginate(query) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  return { page, limit, skip: (page - 1) * limit };
}
