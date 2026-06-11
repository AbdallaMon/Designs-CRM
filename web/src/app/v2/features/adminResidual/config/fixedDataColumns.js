// Declarative columns for the fixed-data list (DataTablePage). The GET read lives in the
// utilities module; the adminResidual surface owns the WRITES (create/update/delete) + the
// generic model-archive toggle. Config — NOT JSX in the page. Single-language Arabic / RTL.

export const fixedDataColumns = [
  { field: "id", headerName: "المعرّف", width: 80 },
  { field: "title", headerName: "العنوان", accessor: (row) => row.title ?? "—" },
  {
    field: "description",
    headerName: "الوصف",
    accessor: (row) => row.description ?? "—",
  },
];
