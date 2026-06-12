"use client";

// <FixedDataList /> — the fixed-data read surface (UX plan §3.9), rendered through the canonical
// <DataTablePage>. listFixedData returns a flat array (NOT server-paginated), so this component
// owns the data via useRequest (non-paginated GET) and paginates + filters CLIENT-side, feeding
// the rows/total/page/pageSize the table expects. Read-only: no row actions. Gated at the CALL
// SITE on PERMISSIONS.UTILITY.FIXED_DATA_LIST. All five states come from <DataTablePage>.
// Single-language Arabic / RTL.

import { useMemo, useState } from "react";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { useT } from "@/app/v2/lib/i18n";
import { DataTablePage } from "@/app/v2/shared/components";
import { FIXED_DATA_URL } from "../config/constant.js";
import { utilitiesMessages } from "../config/utilitiesMessages.js";
import { buildFixedDataColumns, buildFixedDataFilters } from "../config/utilitiesSurfaces.js";

export function FixedDataList() {
  const { t } = useT();
  const columns = useMemo(() => buildFixedDataColumns(t), [t]);
  const filters = useMemo(() => buildFixedDataFilters(t), [t]);

  const { data, isLoading, error, refetch } = useRequest({
    url: FIXED_DATA_URL,
    method: "get",
    autoFetch: true,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterValues, setFilterValues] = useState({ search: "" });

  const all = Array.isArray(data) ? data : [];

  // Client-side filter over the title.
  const filtered = useMemo(() => {
    const q = (filterValues.search || "").trim().toLowerCase();
    if (!q) return all;
    return all.filter((row) => String(row?.title ?? "").toLowerCase().includes(q));
  }, [all, filterValues.search]);

  // Client-side page slice.
  const total = filtered.length;
  const rows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <DataTablePage
      columns={columns}
      filters={filters}
      rows={rows}
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      filterValues={filterValues}
      onFilterChange={(key, value) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
        setPage(1);
      }}
      loading={isLoading}
      error={error}
      onRetry={refetch}
      errorResolver={utilitiesMessages}
      getRowKey={(row) => row?.id}
      empty={{
        title: t("utilities.fixedData.empty.title"),
        description: t("utilities.fixedData.empty.description"),
      }}
    />
  );
}

export default FixedDataList;
