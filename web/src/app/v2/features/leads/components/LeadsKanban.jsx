"use client";

// LeadsKanban — the restored legacy deals KANBAN board (drag-drop lead pipeline) as a
// view on the leads screen. Horizontal columns per lead status; each column is fetched
// independently from the PER-STATUS aggregator GET /v2/leads/columns?status=<STATUS>
// (envelope data: { data: [...leads(+capabilities.*)], totalValue, totalLeads }) — exactly
// the legacy KanbanLeadsStatus board, which issued one request per column.
//
// Drag a card from one column to another → leadsService.changeStatus(id, { status })
// (POST /v2/leads/:id/actions/change-status). The move is OPTIMISTIC (the card jumps
// immediately); on failure we revert and the toast (via runLeadMutation → code→Arabic)
// explains why. The server still enforces scope (capabilities.* is cosmetic) — a card the
// user can't mutate is not draggable.
//
// Terminal pools (CONVERTED, ARCHIVED) are READ-ONLY: not drop targets and their cards are
// not draggable. The ON_HOLD pool is shown and is a valid drop target. Single-language
// Arabic / RTL — columns flow right-to-left via the row's natural RTL direction.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Link from "next/link";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdOpenInNew, MdRefresh, MdLock } from "react-icons/md";
import { useTheme } from "@mui/material/styles";
import { StatusChip, ErrorState, EmptyState } from "@/app/v2/shared/components";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { LEAD_STATUS_LABELS, statusLabel } from "../config/leadsConstants.js";
import { leadsService } from "../leads.service.js";
import { runLeadMutation } from "../leads.mutations.js";
import { leadsMessages } from "../config/leadsMessages.js";

const CARD_DND_TYPE = "LEAD_CARD";

// Board column order (legacy KanbanLeadsStatus + the ON_HOLD pool and the read-only
// terminal pools). Each column is fetched independently. `readonly` columns are neither
// draggable-from nor droppable-into (the lead has left the active pipeline).
const BOARD_COLUMNS = [
  { status: "NEW", readonly: false },
  { status: "IN_PROGRESS", readonly: false },
  { status: "INTERESTED", readonly: false },
  { status: "NEEDS_IDENTIFIED", readonly: false },
  { status: "NEGOTIATING", readonly: false },
  { status: "LEADEXCHANGE", readonly: false },
  { status: "FINALIZED", readonly: false },
  { status: "ON_HOLD", readonly: false },
  { status: "REJECTED", readonly: false },
  { status: "CONVERTED", readonly: true },
  { status: "ARCHIVED", readonly: true },
];

// ── single lead card ────────────────────────────────────────────────────────────
function LeadCard({ lead, columnReadonly }) {
  // A card is draggable only when the lead is in an active (non-readonly) column AND the
  // backend granted mutate scope (capabilities.canChangeStatus / canMutate). UI gating is
  // cosmetic — the server re-checks on the action endpoint.
  const caps = lead?.capabilities ?? {};
  const canDrag =
    !columnReadonly && (caps.canChangeStatus ?? caps.canMutate ?? caps.canEdit ?? false);

  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: CARD_DND_TYPE,
      item: { id: lead.id, fromStatus: lead.status },
      canDrag,
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [lead.id, lead.status, canDrag],
  );

  const clientName = lead?.client?.name ?? `عميل #${lead?.id}`;
  const owner = lead?.assignedTo?.name;

  return (
    <Paper
      ref={dragRef}
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        cursor: canDrag ? "grab" : "default",
        opacity: isDragging ? 0.4 : 1,
        transition: "box-shadow .15s, opacity .15s",
        "&:hover": { boxShadow: 2 },
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {clientName}
          </Typography>
          <Tooltip title="فتح ملف العميل">
            <IconButton
              component={Link}
              href={`/v2/leads/${lead.id}`}
              size="small"
              onClick={(e) => e.stopPropagation()}
              // stop the drag from hijacking the click on the link
              onMouseDown={(e) => e.stopPropagation()}
            >
              <MdOpenInNew fontSize="0.95rem" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Typography variant="caption" color="text.secondary">
            #{lead.id}
          </Typography>
          <StatusChip status={lead.status} domain="lead" />
        </Stack>

        {owner && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            المسؤول: {owner}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

// ── one board column (own fetch + drop target) ───────────────────────────────────
function KanbanColumn({ status, readonly, refreshToken, onDropCard, registerRefetch }) {
  const theme = useTheme();
  const [leads, setLeads] = useState([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchColumn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await leadsService.listColumns({ status });
      // Envelope: data: { data: [...], totalValue, totalLeads }.
      const payload = res?.data ?? {};
      const items = Array.isArray(payload.data) ? payload.data : [];
      setLeads(items);
      setCount(Number(payload.totalLeads ?? items.length) || 0);
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setLeads([]);
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchColumn();
  }, [fetchColumn, refreshToken]);

  // Expose this column's setLeads + refetch to the parent so an optimistic cross-column
  // move can insert/remove cards and revert on failure.
  useEffect(() => {
    registerRefetch(status, { setLeads, refetch: fetchColumn });
  }, [status, registerRefetch, fetchColumn]);

  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: CARD_DND_TYPE,
      canDrop: (item) => !readonly && item.fromStatus !== status,
      drop: (item) => onDropCard(item, status),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [status, readonly, onDropCard],
  );

  const active = isOver && canDrop;

  return (
    <Paper
      ref={dropRef}
      elevation={0}
      sx={{
        width: 300,
        minWidth: 300,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        maxHeight: "70vh",
        bgcolor: active ? "action.hover" : "background.default",
        border: 1,
        borderColor: active ? "primary.main" : "divider",
        borderRadius: 3,
        transition: "background-color .15s, border-color .15s",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {LEAD_STATUS_LABELS[status] ?? statusLabel(status)}
          </Typography>
          {readonly && (
            <Tooltip title="قائمة للقراءة فقط — لا يمكن النقل إليها">
              <Box sx={{ display: "flex", color: "text.disabled" }}>
                <MdLock fontSize="0.9rem" />
              </Box>
            </Tooltip>
          )}
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Chip size="small" label={count} sx={{ fontWeight: 700 }} />
          <Tooltip title="تحديث القائمة">
            <IconButton size="small" onClick={fetchColumn} aria-label={`تحديث ${statusLabel(status)}`}>
              <MdRefresh fontSize="0.95rem" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Box sx={{ p: 1.25, overflowY: "auto", flex: 1 }}>
        {isLoading ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : error ? (
          <ErrorState error={error} onRetry={fetchColumn} resolver={leadsMessages} title="تعذّر تحميل القائمة" />
        ) : leads.length === 0 ? (
          <Box sx={{ py: 3 }}>
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: "block", textAlign: "center" }}
            >
              لا يوجد عملاء في هذه القائمة
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.25}>
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} columnReadonly={readonly} />
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}

// ── board ─────────────────────────────────────────────────────────────────────────
export function LeadsKanban() {
  const { setLoading } = useToastContext();
  // Bumping this forces every column to refetch (the global refresh button).
  const [refreshToken, setRefreshToken] = useState(0);
  // Per-column handles { setLeads, refetch } so we can optimistically move a card.
  const columnsRef = useRef({});

  const registerRefetch = useCallback((status, handle) => {
    columnsRef.current[status] = handle;
  }, []);

  // Optimistic cross-column move + server write. On failure: revert both columns by
  // refetching them, and the toast (runLeadMutation) surfaces the resolved error code.
  const onDropCard = useCallback(
    async (item, toStatus) => {
      const { id, fromStatus } = item;
      if (fromStatus === toStatus) return;

      const fromCol = columnsRef.current[fromStatus];
      const toCol = columnsRef.current[toStatus];

      // Optimistic local move: pull the card out of the source column and drop a
      // status-updated copy into the target column.
      let movedCard = null;
      fromCol?.setLeads?.((prev) => {
        movedCard = prev.find((l) => l.id === id) ?? null;
        return prev.filter((l) => l.id !== id);
      });
      if (movedCard) {
        const updated = { ...movedCard, status: toStatus };
        toCol?.setLeads?.((prev) => [updated, ...prev]);
      }

      const res = await runLeadMutation(
        () => leadsService.changeStatus(id, { status: toStatus }),
        { setLoading, loading: "جاري تغيير الحالة..." },
      );

      if (res) {
        // Re-sync both columns with the server (counts / derived fields).
        fromCol?.refetch?.();
        toCol?.refetch?.();
      } else {
        // Revert: refetch source + target to restore the pre-drag state.
        fromCol?.refetch?.();
        toCol?.refetch?.();
      }
    },
    [setLoading],
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            اسحب بطاقة العميل إلى قائمة أخرى لتغيير حالتها.
          </Typography>
          <Tooltip title="تحديث اللوحة كاملة">
            <IconButton onClick={() => setRefreshToken((n) => n + 1)} aria-label="تحديث اللوحة">
              <MdRefresh />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Columns flow right-to-left in RTL via the row's natural direction. */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            overflowX: "auto",
            pb: 2,
            alignItems: "flex-start",
          }}
        >
          {BOARD_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              readonly={col.readonly}
              refreshToken={refreshToken}
              onDropCard={onDropCard}
              registerRefetch={registerRefetch}
            />
          ))}
        </Box>
      </Stack>
    </DndProvider>
  );
}

export default LeadsKanban;
