// Config-driven columns for the SURFACE-1 admin reference-data tables (the contract lives here,
// not inline in the page). One column set per reference type; `accessor` reads the §5c shape
// (relation-titled models → title[0].text via readPickListLabel; designImage → imageUrl).
// Single-language Arabic / RTL.

import { readPickListLabel } from "./imageSessionsConstants.js";

const idCol = { field: "id", headerName: "#", width: 64 };

// Generic relation-titled list (space / material / style / color): show the Arabic title.
function titleColumns(model) {
  return [
    idCol,
    {
      field: "title",
      headerName: "الاسم",
      accessor: (row) => readPickListLabel(model, row) || `#${row.id}`,
    },
  ];
}

export const REFERENCE_COLUMNS = {
  spaces: (model) => titleColumns(model),
  materials: (model) => titleColumns(model),
  styles: (model) => titleColumns(model),
  colors: (model) => [
    ...titleColumns(model),
    {
      field: "background",
      headerName: "الخلفية",
      accessor: (row) => row.background ?? "—",
    },
  ],
  pageInfo: () => [
    idCol,
    { field: "type", headerName: "النوع", accessor: (row) => row.type ?? "—" },
    {
      field: "title",
      headerName: "العنوان",
      accessor: (row) => (Array.isArray(row.title) ? (row.title[0]?.text ?? "—") : (row.title ?? "—")),
    },
  ],
  images: () => [
    idCol,
    {
      field: "imageUrl",
      headerName: "الصورة",
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

export function columnsFor(typeKey, model) {
  const fn = REFERENCE_COLUMNS[typeKey];
  return fn ? fn(model) : [idCol];
}
