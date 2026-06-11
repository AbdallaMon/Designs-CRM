// Declarative column config for the admin courses LIST (<DataTablePage>). Columns are DATA,
// not JSX in the page (the config/ folder is the contract). `accessor(row)` renders the cell;
// labels are Arabic. Mirrors features/users/config/usersColumns.js.

import { publishLabel } from "./coursesConstants.js";

export const coursesColumns = [
  { field: "id", headerName: "#", width: 70, accessor: (row) => row.id },
  { field: "title", headerName: "عنوان الدورة", accessor: (row) => row.title ?? `دورة #${row.id}` },
  {
    field: "lessons",
    headerName: "الدروس",
    width: 90,
    align: "center",
    accessor: (row) => row?._count?.lessons ?? row?.lessons?.length ?? "—",
  },
  {
    field: "isPublished",
    headerName: "الحالة",
    width: 110,
    accessor: (row) => publishLabel(row.isPublished),
  },
];

export default coursesColumns;
