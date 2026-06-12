// Declarative column descriptors for the Fixed Data admin table. The manager maps these to
// table cells — columns live in config/, not inline in the component (the config folder is the
// contract). `accessor(row)` pulls the display value. Single language (Arabic, RTL).
//
// Row shape (from GET /v2/utilities/fixed-data, prisma.fixedData):
//   { id, title, description, createdAt }
import dayjs from "dayjs";

export const fixedDataColumns = [
  {
    field: "id",
    headerName: "الرقم",
    accessor: (row) => `#${row?.id ?? "—"}`,
  },
  {
    field: "title",
    headerName: "العنوان",
    accessor: (row) => row?.title ?? "—",
  },
  {
    field: "description",
    headerName: "الوصف",
    accessor: (row) => row?.description || "—",
  },
  {
    field: "createdAt",
    headerName: "تاريخ الإنشاء",
    accessor: (row) =>
      row?.createdAt ? dayjs(row.createdAt).format("YYYY-MM-DD") : "—",
  },
];
