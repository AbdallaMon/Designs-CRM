// Declarative column descriptors for the admin user-management list. Columns live in config/,
// not inline in the page (the config folder is the contract). `accessor(row)` returns the cell
// node. Mirrors features/leads/config/leadsColumns.js.
//
// i18n: headers are bilingual, so the columns are a FACTORY — buildUsersColumns(t) is called
// inside the page (where useT is available). NEVER call a hook at module scope.

import { createElement } from "react";
import dayjs from "dayjs";
import { resolveRoleLabel } from "./usersConstants.js";
import { UserStatusChip } from "../components/UserStatusChip.jsx";

export function buildUsersColumns(t) {
  return [
    {
      field: "id",
      headerName: t("users.columns.id"),
      width: 80,
      accessor: (row) => `#${row.id}`,
    },
    {
      field: "name",
      headerName: t("users.columns.name"),
      accessor: (row) => row?.name ?? "—",
    },
    {
      field: "email",
      headerName: t("users.columns.email"),
      accessor: (row) => row?.email ?? "—",
    },
    {
      field: "role",
      headerName: t("users.columns.role"),
      accessor: (row) => resolveRoleLabel(row?.role),
    },
    {
      field: "isActive",
      headerName: t("users.columns.status"),
      // createElement (not JSX) keeps this config a plain .js file per the repo convention.
      accessor: (row) => createElement(UserStatusChip, { isActive: Boolean(row?.isActive) }),
    },
    {
      field: "createdAt",
      headerName: t("users.columns.createdAt"),
      accessor: (row) => (row?.createdAt ? dayjs(row.createdAt).format("YYYY-MM-DD") : "—"),
    },
  ];
}
