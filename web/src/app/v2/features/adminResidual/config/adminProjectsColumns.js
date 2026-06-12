// Declarative columns for the admin leads-with-projects aggregation (GET /v2/admin/projects).
// Config — NOT JSX in the page. Read-only aggregation; the only write is "create project group".
//
// i18n: headers are bilingual, so the columns are a FACTORY — buildAdminProjectsColumns(t) is
// called inside the component (where useT is available). NEVER call a hook at module scope.

export function buildAdminProjectsColumns(t) {
  return [
    { field: "id", headerName: t("adminResidual.projects.column.id", "المعرّف"), width: 80 },
    {
      field: "client",
      headerName: t("adminResidual.projects.column.client", "العميل"),
      accessor: (row) => row.client?.name ?? row.clientName ?? "—",
    },
    {
      field: "status",
      headerName: t("adminResidual.projects.column.status", "الحالة"),
      accessor: (row) => row.status ?? "—",
    },
    {
      field: "projectsCount",
      headerName: t("adminResidual.projects.column.projectsCount", "عدد المشاريع"),
      align: "left",
      accessor: (row) =>
        row._count?.projects ?? (Array.isArray(row.projects) ? row.projects.length : 0),
    },
    {
      field: "createdAt",
      headerName: t("adminResidual.projects.column.createdAt", "تاريخ الإنشاء"),
      accessor: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString("ar-AE") : "—",
    },
  ];
}
