// Declarative column descriptors for the admin user-management list. Columns live in config/,
// not inline in the page (the config folder is the contract). `accessor(row)` returns the cell
// node. Single-language (Arabic). Mirrors features/leads/config/leadsColumns.js.

import { createElement } from "react";
import dayjs from "dayjs";
import { resolveRoleLabel } from "./usersConstants.js";
import { UserStatusChip } from "../components/UserStatusChip.jsx";

export const usersColumns = [
  {
    field: "id",
    headerName: "الرقم",
    width: 80,
    accessor: (row) => `#${row.id}`,
  },
  {
    field: "name",
    headerName: "الاسم",
    accessor: (row) => row?.name ?? "—",
  },
  {
    field: "email",
    headerName: "البريد الإلكتروني",
    accessor: (row) => row?.email ?? "—",
  },
  {
    field: "role",
    headerName: "الدور",
    accessor: (row) => resolveRoleLabel(row?.role),
  },
  {
    field: "isActive",
    headerName: "الحالة",
    // createElement (not JSX) keeps this config a plain .js file per the repo convention.
    accessor: (row) => createElement(UserStatusChip, { isActive: Boolean(row?.isActive) }),
  },
  {
    field: "createdAt",
    headerName: "تاريخ الإنشاء",
    accessor: (row) => (row?.createdAt ? dayjs(row.createdAt).format("YYYY-MM-DD") : "—"),
  },
];
