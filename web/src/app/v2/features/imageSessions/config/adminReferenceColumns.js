// Config-driven columns for the SURFACE-1 admin reference-data tables (the contract lives here,
// not inline in the page). One column set per reference type; `accessor` reads the §5c shape
// (relation-titled models → title[0].text via readPickListLabel; designImage → imageUrl).
// Header labels are resolved via the i18n `t` (Arabic verbatim is the fallback). RTL.
//
// `columnsFor(typeKey, model, t)` is called INSIDE a component (where `t` comes from useT) — never
// at module scope. When `t` is absent it falls back to the Arabic literal so nothing breaks.

import { readPickListLabel } from "./imageSessionsConstants.js";

// Translate helper: resolve a key with Arabic fallback; tolerate a missing `t`.
const tr = (t, key, fallback) => (t ? t(key, fallback) : fallback);

const idCol = { field: "id", headerName: "#", width: 64 };

// Generic relation-titled list (space / material / style / color): show the Arabic title.
function titleColumns(model, t) {
  return [
    idCol,
    {
      field: "title",
      headerName: tr(t, "imageSessions.columns.name", "الاسم"),
      accessor: (row) => readPickListLabel(model, row) || `#${row.id}`,
    },
  ];
}

export const REFERENCE_COLUMNS = {
  spaces: (model, t) => titleColumns(model, t),
  materials: (model, t) => titleColumns(model, t),
  styles: (model, t) => titleColumns(model, t),
  colors: (model, t) => [
    ...titleColumns(model, t),
    {
      field: "background",
      headerName: tr(t, "imageSessions.columns.background", "الخلفية"),
      accessor: (row) => row.background ?? "—",
    },
  ],
  pageInfo: (model, t) => [
    idCol,
    { field: "type", headerName: tr(t, "imageSessions.columns.type", "النوع"), accessor: (row) => row.type ?? "—" },
    {
      field: "title",
      headerName: tr(t, "imageSessions.columns.title", "العنوان"),
      accessor: (row) => (Array.isArray(row.title) ? (row.title[0]?.text ?? "—") : (row.title ?? "—")),
    },
  ],
  images: (model, t) => [
    idCol,
    {
      field: "imageUrl",
      headerName: tr(t, "imageSessions.columns.image", "الصورة"),
      accessor: (row) =>
        row.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.imageUrl}
            alt={`#${row.id}`}
            style={{ width: 72, height: 48, objectFit: "cover", borderRadius: 4 }}
          />
        ) : (
          "—"
        ),
    },
  ],
};

export function columnsFor(typeKey, model, t) {
  const fn = REFERENCE_COLUMNS[typeKey];
  return fn ? fn(model, t) : [idCol];
}
