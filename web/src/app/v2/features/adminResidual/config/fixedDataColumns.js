// Declarative columns for the fixed-data list (DataTablePage). The GET read lives in the
// utilities module; the adminResidual surface owns the WRITES (create/update/delete) + the
// generic model-archive toggle. Config — NOT JSX in the page.
//
// i18n: headers are bilingual, so the columns are a FACTORY — buildFixedDataColumns(t) is called
// inside the component (where useT is available). NEVER call a hook at module scope.

export function buildFixedDataColumns(t) {
  return [
    { field: "id", headerName: t("adminResidual.fixedData.column.id", "المعرّف"), width: 80 },
    {
      field: "title",
      headerName: t("adminResidual.fixedData.column.title", "العنوان"),
      accessor: (row) => row.title ?? "—",
    },
    {
      field: "description",
      headerName: t("adminResidual.fixedData.column.description", "الوصف"),
      accessor: (row) => row.description ?? "—",
    },
  ];
}
