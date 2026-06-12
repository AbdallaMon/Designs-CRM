"use client";

// Users feature — admin user-management LIST. Redesigned on the Phase-0 shared primitives
// (PageHeader + DataTablePage + the five states). Collapses the legacy per-role-slot user
// admin into ONE permission-gated screen: visibility is gated on PERMISSIONS.USER.LIST, the
// "إنشاء مستخدم" CTA on PERMISSIONS.USER.CREATE, and EACH row action on the permission code
// AND the row's backend-computed capabilities.* (capability + code, never role). UI gating is
// cosmetic; the BE still enforces. Single-language Arabic / RTL.

import { useEffect, useMemo, useState } from "react";
import { Box, Container, IconButton, Tooltip } from "@mui/material";
import { MdOpenInNew, MdBlock, MdCheckCircleOutline } from "react-icons/md";
import Link from "next/link";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useDebounce } from "@/app/v2/hooks/useDebounce";
import { useT } from "@/app/v2/lib/i18n";
import {
  PageHeader,
  DataTablePage,
  PartialPermissionState,
} from "@/app/v2/shared/components";
import { useUsersList } from "../hooks/useUsersList.js";
import { buildUsersColumns } from "../config/usersColumns.js";
import { buildUsersFilters } from "../config/usersFilters.js";
import { usersMessages } from "../config/usersMessages.js";
import { usersService } from "../users.service.js";
import { runUsersMutation } from "../users.mutations.js";
import { CreateUserModal } from "../components/CreateUserModal.jsx";

const P = PERMISSIONS.USER;

// Map the toolbar status enum (ACTIVE/BANNED) to the BE list contract value (active/banned).
const STATUS_TO_BE = { ACTIVE: "active", BANNED: "banned" };

export function UsersPage() {
  const { hasPermission } = usePermission();
  const { t } = useT();
  const canList = hasPermission(P.LIST);
  const canCreate = hasPermission(P.CREATE);
  const canUpdate = hasPermission(P.UPDATE);

  const [filterValues, setFilterValues] = useState({ search: "", status: "ALL" });
  const [createOpen, setCreateOpen] = useState(false);

  const {
    items,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    setFilters,
    isLoading,
    error,
    refetch,
  } = useUsersList({ autoFetch: canList });

  // Debounce the id search; the BE list only honors `filters.userId` + `filters.status`
  // (see usersFilters.js BE-parity note), so we build the JSON `filters` object here.
  const debouncedSearch = useDebounce(filterValues.search, 400);

  useEffect(() => {
    const next = {};
    const term = String(debouncedSearch ?? "").trim();
    if (/^\d+$/.test(term)) next.userId = term;
    const status = filterValues.status;
    if (status && status !== "ALL" && STATUS_TO_BE[status]) next.status = STATUS_TO_BE[status];
    setFilters(next);
    // setFilters is a stable callback from the list hook (resets to page 1).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filterValues.status]);

  function onFilterChange(key, value) {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }

  // Per-row ban/unban via changeStatus (PATCH body { user:{ isActive } }). Gated on the row
  // capability `canToggleStatus` (folds USER.UPDATE × not-self on the BE) AND the code.
  // CONTRACT NOTE: the BE repo TOGGLES the passed flag (data.isActive = !isActive), so the
  // body must carry the user's CURRENT isActive — the server flips it. We pass row.isActive.
  async function toggleStatus(row) {
    const res = await runUsersMutation(
      () => usersService.changeStatus(row.id, row.isActive),
      { loading: row.isActive ? t("users.toast.banning") : t("users.toast.activating") },
    );
    if (res) refetch();
  }

  function renderRowActions(row) {
    const caps = row?.capabilities ?? {};
    const canToggle = canUpdate && Boolean(caps.canToggleStatus);
    return (
      <>
        {canToggle && (
          <Tooltip title={row.isActive ? t("users.actions.ban") : t("users.actions.unban")}>
            <IconButton
              size="small"
              color={row.isActive ? "error" : "success"}
              onClick={() => toggleStatus(row)}
            >
              {row.isActive ? <MdBlock /> : <MdCheckCircleOutline />}
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={t("users.actions.openUserFile")}>
          <IconButton size="small" component={Link} href={`/v2/users/${row.id}`}>
            <MdOpenInNew />
          </IconButton>
        </Tooltip>
      </>
    );
  }

  const columns = useMemo(() => buildUsersColumns(t), [t]);
  const filters = useMemo(() => buildUsersFilters(t), [t]);

  const empty = useMemo(
    () => ({
      title: t("users.empty.title"),
      description: canCreate
        ? t("users.empty.descriptionCanCreate")
        : t("users.empty.descriptionNoMatch"),
      action: canCreate
        ? { label: t("users.actions.create"), onClick: () => setCreateOpen(true) }
        : undefined,
    }),
    [canCreate, t],
  );

  if (!canList) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <PartialPermissionState
          denied
          title={t("users.denied.title")}
          message={t("users.denied.message")}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title={t("users.title")}
        subtitle={`${t("users.totalPrefix")} ${total}`}
        breadcrumbs={[
          { label: t("users.breadcrumbs.admin") },
          { label: t("users.breadcrumbs.users") },
        ]}
        primaryAction={
          canCreate
            ? { label: t("users.actions.create"), onClick: () => setCreateOpen(true) }
            : undefined
        }
      />

      <Box>
        <DataTablePage
          columns={columns}
          filters={filters}
          rows={items}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          errorResolver={usersMessages}
          getRowKey={(row) => row.id}
          renderRowActions={renderRowActions}
          rowHref={(row) => `/v2/users/${row.id}`}
          empty={empty}
        />
      </Box>

      {canCreate && (
        <CreateUserModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            refetch();
          }}
        />
      )}
    </Container>
  );
}

export default UsersPage;
