"use client";
import { LEAD_STATUSES, KANBAN_VIEW_TYPES } from "@dms/shared";
import {
  statusColors,
  KanbanLeadsStatus,
} from "@/app/helpers/constants";
import {
  Box,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  styled,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { BiDollarCircle } from "react-icons/bi";
import { BsInbox, BsExclamationTriangle } from "react-icons/bs";
import LeadCard from "@/features/Kanban/leads/KanbanLeadCard.jsx";
import colors from "@/app/helpers/colors";
import { useDrop } from "react-dnd";
import WorkStageKanbanCard from "@/features/Kanban/work-stages/WorkStageKanbanCard.jsx";
import { FinalizeModal } from "@/features/leads/widgets/FinalizeModal.jsx";
import { useEffect, useState } from "react";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { getData } from "@/app/helpers/functions/getData";

const ItemTypes = {
  CARD: "card",
};

// Deal transitions that are effectively irreversible from the board — dropping a card
// onto one of these asks for confirmation first (FINALIZED keeps its own dedicated modal).
const TERMINAL_DEAL_STATUSES = new Set([LEAD_STATUSES.REJECTED, "ARCHIVED"]);

const ColumnHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== "statusColor",
})(({ theme, statusColor }) => ({
  position: "sticky",
  top: 0,
  zIndex: 5,
  background: `linear-gradient(180deg, ${statusColor}14 0%, ${theme.palette.background.paper} 100%)`,
  backdropFilter: "blur(6px)",
  padding: theme.spacing(1.75, 1.75, 1.5),
  borderRadius: "14px 14px 0 0",
  boxShadow: "none",
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const StatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== "statuscolor",
})(({ theme, statuscolor }) => ({
  backgroundColor: `${statuscolor}20`,
  color: statuscolor,
  fontWeight: 700,
  height: "24px",
  border: `1px solid ${statuscolor}33`,
  "& .MuiChip-label": {
    padding: "0 10px",
    fontSize: "0.78rem",
  },
}));

const KanbanColumn = ({
  status,
  isAdminOrSuperSales,
  type,
  statusArray,
  reRenderColumns,
  setRerenderColumns,
  staffId,
  filters,
  isNotStaff = false,
  selectedLeads = [],
  setSelectedLeads = () => {},
}) => {
  const admin = isAdminOrSuperSales;
  const [finalizeModel, setFinalizeModel] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  // A drop onto a terminal status is parked here until the user confirms it.
  const [pendingMove, setPendingMove] = useState(null); // { item, newStatus }
  const [leads, setleads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [lead, setCurrentLead] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const take = 20;
  const [, drop] = useDrop({
    accept: ItemTypes.CARD,
    drop: (item) => {
      movelead(item, status);
    },
  });

  const statusColor = statusColors[status];
  const { setLoading: setToastLoading } = useToastContext();
  function loadMore() {
    setPage((prev) => prev + 1);
  }
  const fetchLeads = async () => {
    setError(false);
    const request = await getData({
      url: isNotStaff
        ? `projects/designers/columns?skip=${
            page * take
          }&take=${take}&type=${type}&status=${status}&staffId=${staffId}&`
        : `leads/columns?status=${status}&skip=${
            page * take
          }&take=${take}&staffId=${staffId}&type=${type}&`,
      filters,
      setData: setleads,
      setLoading,
    });
    if (request.status === 200) {
      if (page === 0) {
        setleads(request.data.data);
      } else {
        setleads((prev) => [...prev, ...request.data.data]); // append
      }
      setTotalValue(request.data.totalValue || 0);
      setTotalLeads(request.data.totalLeads || 0);
      if (request.data.data?.length < take) setHasMore(false);
    } else {
      setError(true);
    }
  };
  useEffect(() => {
    fetchLeads();
  }, [page, filters, status, staffId, reRenderColumns[status]]);
  const handleScroll = (e) => {
    const bottom =
      e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;

    if (bottom && hasMore) {
      loadMore();
    }
  };
  // Reconcile both affected columns from the server after a successful move: the
  // destination refetches (replacing the optimistic card with the real row) and the
  // source column drops the card.
  const reconcileColumns = (oldStatus, newStatus) => {
    setRerenderColumns((prev) => ({
      ...prev,
      [oldStatus]: !prev[oldStatus],
      [newStatus]: !prev[newStatus],
    }));
  };

  // Perform the move. Optimistically shows the card in THIS (destination) column
  // immediately, then reconciles on success or rolls the insert back on failure.
  // NOTE: authorization is derived server-side from the session — the client no
  // longer sends an `isAdmin` flag (it was ignored by the backend).
  const commitMove = async (l, newStatus) => {
    const oldStatus = isNotStaff ? l.projects?.[0]?.status : l.status;
    if (oldStatus === newStatus) return;

    // Optimistic insert into the destination column (guard against a double drop).
    setleads((prev) =>
      prev.some((p) => p.id === l.id) ? prev : [{ ...l, status: newStatus }, ...prev]
    );

    const request = await handleRequestSubmit(
      isNotStaff
        ? { status: newStatus, oldStatus, id: l.projects[0].id }
        : { status: newStatus, oldStatus },
      isNotStaff ? setLoading : setToastLoading,
      `${isNotStaff ? "projects/designers" : "leads"}/${
        l.id
      }/actions/change-status`,
      false,
      "Updating",
      false,
      "POST"
    );

    if (request.status === 200) {
      reconcileColumns(oldStatus, newStatus);
    } else {
      // Roll the optimistic insert back — the move did not stick.
      setleads((prev) => prev.filter((p) => p.id !== l.id));
    }
  };

  const movelead = async (l, newStatus) => {
    if (type === KANBAN_VIEW_TYPES.CONTRACT_LEVELS) return;

    // Deals moving to FINALIZED go through the finalize modal (price/contract capture).
    if (!isNotStaff && newStatus === LEAD_STATUSES.FINALIZED) {
      setCurrentId(l.id);
      setFinalizeModel(true);
      setCurrentLead(l);
      return;
    }

    // Irreversible deal transitions ask for confirmation before committing.
    if (!isNotStaff && TERMINAL_DEAL_STATUSES.has(newStatus)) {
      setPendingMove({ item: l, newStatus });
      return;
    }

    await commitMove(l, newStatus);
  };

  return (
    <>
      {currentId && (
        <FinalizeModal
          lead={lead}
          open={finalizeModel}
          setOpen={setFinalizeModel}
          id={currentId}
          setId={setCurrentId}
          onUpdate={() => {
            setRerenderColumns((prev) => ({
              ...prev,
              [lead.status]: !prev[lead.status],
              FINALIZED: !prev.FINALIZED,
            }));
          }}
        />
      )}

      {/* Confirm irreversible deal transitions (e.g. reject / archive) before committing. */}
      <Dialog open={Boolean(pendingMove)} onClose={() => setPendingMove(null)}>
        <DialogTitle>Confirm Deal Move</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`This deal will be moved to "${
              KanbanLeadsStatus[pendingMove?.newStatus] ||
              pendingMove?.newStatus ||
              ""
            }". This action can't be easily undone. Do you want to continue?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setPendingMove(null)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              const move = pendingMove;
              setPendingMove(null);
              if (move) commitMove(move.item, move.newStatus);
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Grid
        size={2}
        ref={drop}
        elevation={0}
        sx={{
          bgcolor: "rgba(255,255,255,0.55)",
          p: 0,
          minWidth: 300,
          width: 300,
          maxHeight: "calc(100vh - 32px)",
          borderRadius: "14px",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: `0 1px 2px ${colors.shadow}`,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {loading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
            }}
          >
            <LinearProgress
              sx={{
                height: 3,
                backgroundColor: `${statusColor}22`,
                "& .MuiLinearProgress-bar": {
                  backgroundColor: statusColor,
                },
              }}
            />
          </Box>
        )}
        <ColumnHeader statusColor={statusColor}>
          <Stack spacing={1.25}>
            <Box display="flex" alignItems="center" gap={1.25}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: statusColor,
                  boxShadow: `0 0 0 4px ${statusColor}22`,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="h6"
                color="text.primary"
                sx={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  flexGrow: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={status.replace(/_/g, " ")}
              >
                {status.replace(/_/g, " ")}
              </Typography>
              <StatusChip
                label={totalLeads}
                statuscolor={statusColor}
                size="small"
              />
            </Box>

            <Box
              display="flex"
              alignItems="center"
              gap={0.75}
              sx={{
                color: statusColor,
                bgcolor: `${statusColor}12`,
                py: 0.5,
                px: 1,
                borderRadius: "8px",
                width: "fit-content",
              }}
            >
              <BiDollarCircle size={16} />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {totalValue}
              </Typography>
            </Box>
          </Stack>
        </ColumnHeader>
        <Box
          onScroll={handleScroll}
          sx={{
            overflowY: "auto",
            flexGrow: 1,
            px: 0.75,
            pt: 1.5,
            pb: 1,
            "::-webkit-scrollbar": {
              width: "6px",
            },
            "::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "::-webkit-scrollbar-thumb": {
              background: "#d6cdc2",
              borderRadius: "4px",
            },
            "::-webkit-scrollbar-thumb:hover": {
              background: "#c4b8ab",
            },
          }}
        >
          {!loading && error && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                py: 6,
                px: 2,
                color: "error.main",
                textAlign: "center",
              }}
            >
              <BsExclamationTriangle size={28} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Failed to load items
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                An error occurred while loading. Please try again.
              </Typography>
              <Button
                onClick={fetchLeads}
                variant="outlined"
                size="small"
                sx={{
                  mt: 0.5,
                  borderRadius: "10px",
                  textTransform: "none",
                }}
              >
                Retry
              </Button>
            </Box>
          )}
          {!loading && !error && (!leads || leads.length === 0) && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                py: 6,
                px: 2,
                color: "text.disabled",
                textAlign: "center",
              }}
            >
              <BsInbox size={28} style={{ color: statusColor, opacity: 0.6 }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                No items
              </Typography>
            </Box>
          )}
          <Stack spacing={1.25}>
            {leads?.map((lead) => {
              if (
                type === KANBAN_VIEW_TYPES.STAFF ||
                type === KANBAN_VIEW_TYPES.CONTRACT_LEVELS
              ) {
                return (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    movelead={movelead}
                    admin={admin}
                    setleads={setleads}
                    type={type}
                    statusArray={statusArray}
                    setRerenderColumns={setRerenderColumns}
                    reRenderColumns={reRenderColumns}
                    selectedLeads={selectedLeads}
                    setSelectedLeads={setSelectedLeads}
                  />
                );
              } else {
                return (
                  <WorkStageKanbanCard
                    key={lead.id}
                    lead={lead}
                    movelead={movelead}
                    admin={admin}
                    setleads={setleads}
                    type={type}
                    statusArray={statusArray}
                    setRerenderColumns={setRerenderColumns}
                    reRenderColumns={reRenderColumns}
                  />
                );
              }
            })}
            {!hasMore && totalLeads > (leads?.length || 0) && (
              <Button
                onClick={loadMore}
                variant="outlined"
                fullWidth
                sx={{
                  mb: 2,
                  borderRadius: "10px",
                  textTransform: "none",
                  borderColor: `${statusColor}55`,
                  color: statusColor,
                  "&:hover": {
                    borderColor: statusColor,
                    bgcolor: `${statusColor}12`,
                  },
                }}
              >
                Load more
              </Button>
            )}
            {loading && leads?.length > 0 && (
              <Box
                sx={{
                  textAlign: "center",
                  color: "text.secondary",
                  padding: 1.5,
                  fontSize: "0.8rem",
                }}
              >
                Loading...
              </Box>
            )}

            {!loading && hasMore && leads?.length > 0 && (
              <Box
                sx={{
                  textAlign: "center",
                  color: "text.disabled",
                  padding: 1.5,
                  fontSize: "0.8rem",
                }}
              >
                Loading more...
              </Box>
            )}
          </Stack>
        </Box>
      </Grid>
    </>
  );
};

export default KanbanColumn;
