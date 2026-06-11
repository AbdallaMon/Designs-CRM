// Declarative columns for the admin leads-with-projects aggregation (GET /v2/admin/projects).
// Config — NOT JSX in the page. Read-only aggregation; the only write is "create project group".
// Single-language Arabic / RTL.

export const adminProjectsColumns = [
  { field: "id", headerName: "المعرّف", width: 80 },
  {
    field: "client",
    headerName: "العميل",
    accessor: (row) => row.client?.name ?? row.clientName ?? "—",
  },
  {
    field: "status",
    headerName: "الحالة",
    accessor: (row) => row.status ?? "—",
  },
  {
    field: "projectsCount",
    headerName: "عدد المشاريع",
    align: "left",
    accessor: (row) =>
      row._count?.projects ?? (Array.isArray(row.projects) ? row.projects.length : 0),
  },
  {
    field: "createdAt",
    headerName: "تاريخ الإنشاء",
    accessor: (row) =>
      row.createdAt ? new Date(row.createdAt).toLocaleDateString("ar-AE") : "—",
  },
];
