"use client";

// Projects board list page. Collapses the legacy per-role-slot projects screens
// (@admin|@super_admin|@super_sales|@threeD|@twoD /projects + /projects/archived) into ONE
// permission-gated feature: visibility + per-project actions are driven by usePermission +
// the per-record capabilities.* the v2 API returns, NOT by role slot. The BE designer
// board already narrows the rows by role/self (admin sees all, designers see their own),
// so this single code path renders the same board each role saw before.
//
// Two views, toggled in-page (was two separate role-slot routes): "designers" (active
// board) and "archived". Each view lists leads carrying grouped projects; LeadProjects
// renders the group tabs + the selected project's work-surface.

import { useEffect, useState } from "react";
import {
  Box,
  Container,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TablePagination,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdRefresh } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useDebounce } from "@/app/v2/hooks/useDebounce";
import { useProjectBoard } from "../hooks/useProjectBoard.js";
import { LeadProjects } from "../components/LeadProjects.jsx";
import { PROJECT_TYPES, PROJECT_TYPE_LABELS } from "../config/projectsConstants.js";

export function ProjectsPage() {
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.PROJECT.LIST);

  const [mode, setMode] = useState("designers");
  // The designers board is partitioned by project `type` (department). The legacy app had
  // one kanban route per type and ALWAYS sent `?type=`; the v2 board keeps that contract
  // via this selector (default = the first project type). The BE narrows rows by role/self
  // WITHIN the selected type (admin sees all of that type, designers only their own), so
  // each role sees the same rows it saw on the legacy per-type board.
  const [boardType, setBoardType] = useState(PROJECT_TYPES[0]);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const {
    items,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    setFilters,
    isLoading,
    refetch,
  } = useProjectBoard({ mode, type: boardType, autoFetch: canList });

  // Parity with legacy: the board search is by lead id (the SearchComponent posted an `id`
  // filter). A non-numeric term matches nothing → no id filter.
  useEffect(() => {
    const term = debouncedSearch.trim();
    const id = /^\d+$/.test(term) ? term : null;
    setFilters(id ? { id } : {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  if (!canList) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Typography color="textSecondary">لا تملك صلاحية الوصول إلى المشاريع</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        المشاريع
      </Typography>

      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Stack direction="row" sx={{ gap: 2, flexWrap: "wrap", p: 2, alignItems: "center" }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mode}
            onChange={(_e, v) => v && setMode(v)}
          >
            <ToggleButton value="designers">النشطة</ToggleButton>
            <ToggleButton value="archived">المؤرشفة</ToggleButton>
          </ToggleButtonGroup>
          {mode === "designers" && (
            <Select
              size="small"
              value={boardType}
              onChange={(e) => {
                setBoardType(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 200 }}
            >
              {PROJECT_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {PROJECT_TYPE_LABELS[t] ?? t}
                </MenuItem>
              ))}
            </Select>
          )}
          <TextField
            size="small"
            label="بحث برقم العميل"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{ minWidth: 240 }}
          />
          <Box sx={{ flex: 1 }} />
          <Tooltip title="تحديث">
            <IconButton onClick={refetch}>
              <MdRefresh />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {isLoading ? (
        <Typography sx={{ py: 4, textAlign: "center" }} color="text.secondary">
          جاري التحميل...
        </Typography>
      ) : items.length === 0 ? (
        <Typography sx={{ py: 4, textAlign: "center" }} color="text.secondary">
          لا توجد بيانات
        </Typography>
      ) : (
        items.map((lead) => (
          <Box key={lead.id} my={2}>
            <LeadProjects
              clientLeadId={lead.id}
              initialProjects={lead.groupedProjects || lead.projects || []}
              noInitialLoad
            />
          </Box>
        ))
      )}

      {mode === "archived" && (
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          onPageChange={(_e, p) => setPage(p + 1)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(1);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="عدد الصفوف"
        />
      )}
    </Container>
  );
}

export default ProjectsPage;
