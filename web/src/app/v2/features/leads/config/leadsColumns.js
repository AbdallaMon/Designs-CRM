// Declarative column descriptors for the leads pool list. The page maps these to table
// cells — columns live in config/, not inline in the page (the config folder is the
// contract). `accessor(row)` pulls the display value; `render` (optional) returns JSX.
// Single language (Arabic). Privileged-only columns are flagged with `privileged: true`
// and filtered by the page based on the caller's permissions.

import dayjs from "dayjs";
import { statusLabel, paymentStatusLabel, categoryLabel } from "./leadsConstants.js";

export const leadsColumns = [
  {
    field: "id",
    headerName: "الرقم",
    accessor: (row) => `#${String(row.id).padStart(7, "0")}`,
  },
  {
    field: "client",
    headerName: "العميل",
    privileged: true, // client PII only shown to privileged roles (legacy behavior)
    accessor: (row) => row?.client?.name ?? "—",
  },
  {
    field: "phone",
    headerName: "الهاتف",
    privileged: true,
    accessor: (row) => row?.client?.phone ?? "—",
  },
  {
    field: "category",
    headerName: "التصنيف",
    accessor: (row) => categoryLabel(row?.selectedCategory),
  },
  {
    field: "status",
    headerName: "الحالة",
    accessor: (row) => statusLabel(row?.status),
  },
  {
    field: "paymentStatus",
    headerName: "حالة الدفع",
    accessor: (row) => paymentStatusLabel(row?.paymentStatus),
  },
  {
    field: "createdAt",
    headerName: "تاريخ الإنشاء",
    accessor: (row) => (row?.createdAt ? dayjs(row.createdAt).format("YYYY-MM-DD") : "—"),
  },
];
