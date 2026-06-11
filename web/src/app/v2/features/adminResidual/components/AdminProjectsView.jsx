"use client";

// <AdminProjectsView /> — the leads-with-projects aggregation surface (UX plan §3.10). Lists the
// global aggregation in DataTablePage (paginated via useAdminProjectsList) with a search filter,
// and a "إنشاء مجموعة مشاريع" CTA → CreateProjectGroupModal. View is gated on PROJECT_VIEW (the
// page renders this); the create CTA on PROJECT_GROUP_CREATE. Single-language Arabic / RTL.

import { useEffect, useState } from "react";
import { Box, Button, Stack } from "@mui/material";
import { MdAdd } from "react-icons/md";
import { useDebounce } from "@/app/v2/hooks/useDebounce";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { DataTablePage } from "@/app/v2/shared/components";
import { useAdminProjectsList } from "../hooks/useAdminProjectsList.js";
import { adminProjectsColumns } from "../config/adminProjectsColumns.js";
import { adminResidualMessages } from "../config/adminResidualMessages.js";
import { CreateProjectGroupModal } from "./CreateProjectGroupModal.jsx";

const P = PERMISSIONS.ADMIN_RESIDUAL;

export function AdminProjectsView() {
  const { hasPermission } = usePermission();
  const canCreateGroup = hasPermission(P.PROJECT_GROUP_CREATE);

  const [filterValues, setFilterValues] = useState({ search: "" });
  const [createOpen, setCreateOpen] = useState(false);

  const {
    items,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    setSearch,
    isLoading,
    error,
    refetch,
  } = useAdminProjectsList({ autoFetch: true });

  const debouncedSearch = useDebounce(filterValues.search, 400);
  useEffect(() => {
    setSearch(String(debouncedSearch ?? "").trim());
    // setSearch resets to page 1.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const filters = [
    { key: "search", type: "search", label: "بحث", placeholder: "اسم العميل" },
  ];

  return (
    <>
      {canCreateGroup && (
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<MdAdd />}
            onClick={() => setCreateOpen(true)}
          >
            إنشاء مجموعة مشاريع
          </Button>
        </Stack>
      )}
      <Box>
        <DataTablePage
        columns={adminProjectsColumns}
        filters={filters}
        rows={items}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        filterValues={filterValues}
        onFilterChange={(key, value) => setFilterValues((p) => ({ ...p, [key]: value }))}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        errorResolver={adminResidualMessages}
        getRowKey={(row) => row.id}
        empty={{
          title: "لا توجد مشاريع",
          description: canCreateGroup
            ? "لا توجد سجلات مطابقة. يمكنك إنشاء مجموعة مشاريع لعميل محتمل."
            : "لا توجد سجلات مطابقة للتصفية الحالية.",
          action: canCreateGroup
            ? { label: "إنشاء مجموعة مشاريع", onClick: () => setCreateOpen(true) }
            : undefined,
        }}
        />
      </Box>

      {canCreateGroup && (
        <CreateProjectGroupModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            refetch();
          }}
        />
      )}
    </>
  );
}

export default AdminProjectsView;
