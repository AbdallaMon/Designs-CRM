// Resolves the correct pick-list endpoint for the admin image-session autocomplete
// selectors. The old generic `shared/utilities/ids?model=&where=&select=` endpoint was
// hardened during the migration (FIX 2): it now `.strict()`-rejects `where`/`select` and
// enforces a model allow-list that excludes `Template`/`Style`/`Space`, and it ignores any
// client `where`. Those selectors therefore must call the dedicated, purpose-built admin
// endpoints — which already apply the needed filters (template `type`, `notArchived`) —
// instead of the generic one. See server: image-sessions/admin/*.route.js.
export function resolvePickListUrl({ model, where }) {
  switch (model) {
    case "Template":
      // template ids filtered by type (e.g. COLOR_PATTERN) → returns [{ id }]
      return `admin/image-session/templates/ids${
        where?.type ? `?type=${encodeURIComponent(where.type)}` : ""
      }`;
    case "Style":
      return `admin/image-session/style?notArchived=true`;
    case "Space":
      return `admin/image-session/space?notArchived=true`;
    default:
      // Fallback: the generic allow-listed pick-list (delegate names are lowercase-first).
      return `shared/utilities/ids?model=${model}`;
  }
}
