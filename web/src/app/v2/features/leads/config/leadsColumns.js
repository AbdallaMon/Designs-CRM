// Declarative column descriptors for the leads pool list. The page maps these to table
// cells — columns live in config/, not inline in the page (the config folder is the
// contract). `accessor(row)` pulls the display value; `render` (optional) returns JSX.
// Privileged-only columns are flagged with `privileged: true` and filtered by the page
// based on the caller's permissions.
//
// i18n: headers are bilingual, so the columns are a FACTORY — buildLeadsColumns(t) is called
// inside the page (where useT is available). NEVER call a hook at module scope.

import dayjs from "dayjs";
import { statusLabel, paymentStatusLabel, categoryLabel } from "./leadsConstants.js";

export function buildLeadsColumns(t) {
  return [
    {
      field: "id",
      headerName: t("leads.columns.id"),
      accessor: (row) => `#${String(row.id).padStart(7, "0")}`,
    },
    {
      field: "client",
      headerName: t("leads.columns.client"),
      privileged: true, // client PII only shown to privileged roles (legacy behavior)
      accessor: (row) => row?.client?.name ?? "—",
    },
    {
      field: "phone",
      headerName: t("leads.columns.phone"),
      privileged: true,
      accessor: (row) => row?.client?.phone ?? "—",
    },
    {
      field: "category",
      headerName: t("leads.columns.category"),
      accessor: (row) => categoryLabel(row?.selectedCategory),
    },
    {
      field: "status",
      headerName: t("leads.columns.status"),
      accessor: (row) => statusLabel(row?.status),
    },
    {
      field: "paymentStatus",
      headerName: t("leads.columns.paymentStatus"),
      accessor: (row) => paymentStatusLabel(row?.paymentStatus),
    },
    {
      field: "createdAt",
      headerName: t("leads.columns.createdAt"),
      accessor: (row) => (row?.createdAt ? dayjs(row.createdAt).format("YYYY-MM-DD") : "—"),
    },
  ];
}
