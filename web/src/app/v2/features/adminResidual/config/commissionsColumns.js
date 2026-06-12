// Declarative columns for the commissions list (DataTablePage). Config — NOT JSX in the page.
// Shapes the rows returned by GET /v2/admin/commissions?userId= (listCommissions). Fields are
// rendered defensively (the aggregation shape is read-only here).
//
// i18n: headers are bilingual, so the columns are a FACTORY — buildCommissionsColumns(t) is called
// inside the component (where useT is available). NEVER call a hook at module scope.

export function buildCommissionsColumns(t) {
  return [
    { field: "id", headerName: t("adminResidual.commissions.column.id", "المعرّف"), width: 80 },
    {
      field: "leadId",
      headerName: t("adminResidual.commissions.column.leadId", "العميل المحتمل"),
      accessor: (row) => row.clientLead?.client?.name ?? row.leadId ?? "—",
    },
    {
      field: "amount",
      headerName: t("adminResidual.commissions.column.amount", "القيمة"),
      align: "left",
      accessor: (row) => (row.amount != null ? Number(row.amount).toLocaleString("ar-AE") : "—"),
    },
    {
      field: "commissionReason",
      headerName: t("adminResidual.commissions.column.reason", "السبب"),
      accessor: (row) => row.commissionReason ?? row.reason ?? "—",
    },
    {
      field: "createdAt",
      headerName: t("adminResidual.commissions.column.createdAt", "التاريخ"),
      accessor: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString("ar-AE") : "—",
    },
  ];
}
