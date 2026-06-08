// Declarative columns for the commissions list (DataTablePage). Config — NOT JSX in the page.
// Shapes the rows returned by GET /v2/admin/commissions?userId= (listCommissions). Fields are
// rendered defensively (the aggregation shape is read-only here). Single-language Arabic / RTL.

export const commissionsColumns = [
  { field: "id", headerName: "المعرّف", width: 80 },
  {
    field: "leadId",
    headerName: "العميل المحتمل",
    accessor: (row) => row.clientLead?.client?.name ?? row.leadId ?? "—",
  },
  {
    field: "amount",
    headerName: "القيمة",
    align: "left",
    accessor: (row) => (row.amount != null ? Number(row.amount).toLocaleString("ar-AE") : "—"),
  },
  {
    field: "commissionReason",
    headerName: "السبب",
    accessor: (row) => row.commissionReason ?? row.reason ?? "—",
  },
  {
    field: "createdAt",
    headerName: "التاريخ",
    accessor: (row) =>
      row.createdAt ? new Date(row.createdAt).toLocaleDateString("ar-AE") : "—",
  },
];
