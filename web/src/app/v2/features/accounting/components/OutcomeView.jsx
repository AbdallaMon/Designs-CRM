// Outcome view — v2 port of Outcome.jsx. Shows the income/outcome summary cards then a
// paginated outcome list over GET /v2/accounting/outcome. The legacy supported an optional
// date-range filter carried as a JSON `filters` string { range: { startDate, endDate } };
// preserved here. Gated on OUTCOME_LIST (summary cards gated separately on SUMMARY_VIEW).

"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useT } from "@/app/v2/lib/i18n";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { usePaginatedList } from "../hooks/usePaginatedList.js";
import { accountingService } from "../accounting.service.js";
import { IncomeOutcomeSummary } from "./IncomeOutcomeSummary.jsx";

const P = PERMISSIONS.ACCOUNTING;

export function OutcomeView() {
  const { t } = useT();
  const { hasPermission } = usePermission();
  const canList = hasPermission(P.OUTCOME_LIST);

  const [startDate, setStartDate] = useState(dayjs().subtract(3, "month").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));

  const { items, total, page, setPage, pageSize, setPageSize, isLoading, setExtra } = usePaginatedList(
    accountingService.listOutcome,
    { autoFetch: canList, initialExtra: {} },
  );

  function applyRange() {
    // The BE outcome list reads a JSON `filters` string with { range: { startDate, endDate } }.
    setExtra({ filters: { range: { startDate, endDate } } });
  }

  if (!canList) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        {t("accounting.outcome.denied")}
      </Typography>
    );
  }

  return (
    <Box>
      <IncomeOutcomeSummary />

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            type="date"
            size="small"
            label={t("accounting.date.from")}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            size="small"
            label={t("accounting.date.to")}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="outlined" onClick={applyRange}>
            {t("accounting.action.apply")}
          </Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t("accounting.outcome.col.amount")}</TableCell>
              <TableCell>{t("accounting.outcome.col.type")}</TableCell>
              <TableCell>{t("accounting.outcome.col.description")}</TableCell>
              <TableCell>{t("accounting.outcome.col.paymentDate")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {t("accounting.state.loading")}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {t("accounting.state.empty")}
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              items.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.description ?? "—"}</TableCell>
                  <TableCell>{row.createdAt ? dayjs(row.createdAt).format("YYYY/MM/DD") : "—"}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
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
          labelRowsPerPage={t("accounting.table.rowsPerPage")}
        />
      </TableContainer>
    </Box>
  );
}

export default OutcomeView;
