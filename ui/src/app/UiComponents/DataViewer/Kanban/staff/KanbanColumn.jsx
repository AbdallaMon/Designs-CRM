"use client";
import { statusColors } from "@/app/helpers/constants";
import {
  Box,
  Chip,
  Grid2 as Grid,
  LinearProgress,
  Stack,
  styled,
  Typography,
} from "@mui/material";
import { BiDollarCircle } from "react-icons/bi";
import { BsKanban } from "react-icons/bs";
import LeadCard from "../KanbanLeadCard";
import { useDrop } from "react-dnd";
import WorkStageKanbanCard from "../WorkStageKanbanCard";
import { FinalizeModal } from "../../leads/FinalizeModal";
import { useEffect, useState } from "react";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useAuth } from "@/app/providers/AuthProvider";
import { getData } from "@/app/helpers/functions/getData";
import { useInView } from "react-intersection-observer";

const ItemTypes = {
  CARD: "card",
};

const ColumnHeader = styled(Box)(({ theme, statusColor }) => ({
  background: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
  boxShadow: "none",
  border: `1px solid ${theme.palette.divider}`,
  position: "relative",
  "&:before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
    backgroundColor: statusColor,
    borderRadius: "4px 4px 0 0",
  },
}));

export const StatusChip = styled(Chip)(({ theme, statuscolor }) => ({
  backgroundColor: `${statuscolor}20`,
  color: statuscolor,
  fontWeight: 600,
  height: "24px",
  "& .MuiChip-label": {
    padding: "0 8px",
  },
}));

const KanbanColumn = ({
  status,
  admin,
  type,
  statusArray,
  reRenderColumns,
  setRerenderColumns,
  staffId,
  filters,
  isNotStaff = false,
}) => {
  const [finalizeModel, setFinalizeModel] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [leads, setleads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [lead, setCurrentLead] = useState(null);
  const { user } = useAuth();
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
  useEffect(() => {
    const fetchLeads = async () => {
      const request = await getData({
        url: isNotStaff
          ? `shared/client-leads/projects/designers/columns?skip=${
              page * take
            }&take=${take}&type=${type}&status=${status}&staffId=${staffId}&`
          : `shared/client-leads/columns?status=${status}&skip=${
              page * take
            }&take=${take}&staffId=${staffId}&`,
        filters,
        setData: setleads,
        setLoading,
      });
      if (request.status === 200) {
        if (page === 0) {
          setleads(request.data.data); // first page → reset
        } else {
          setleads((prev) => [...prev, ...request.data.data]); // append
        }
        setTotalValue(request.data.totalValue || 0);
        setTotalLeads(request.data.totalLeads || 0);
        if (request.data.data?.length < take) setHasMore(false);
      }
    };

    fetchLeads();
  }, [page, filters, status, staffId, reRenderColumns[status]]);
  const handleScroll = (e) => {
    const bottom =
      e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;

    if (bottom && hasMore) {
      setPage((prev) => prev + 1);
    }
  };
  const movelead = async (l, newStatus) => {
    if (isNotStaff) {
      const request = await handleRequestSubmit(
        {
          status: newStatus,
          oldStatus: l.projects[0].status,
          isAdmin: user.role === "ADMIN",
          id: l.projects[0].id,
        },
        setLoading,
        `shared/client-leads/designers/${l.id}/status`,
        false,
        "Updating",
        false,
        "PUT"
      );
      if (request.status === 200) {
        setRerenderColumns((prev) => ({
          ...prev,
          [l.projects?.[0]?.status]: !prev[l.projects?.[0]?.status],
          [newStatus]: !prev[newStatus],
        }));
      }
    } else {
      if (newStatus === "FINALIZED") {
        setCurrentId(l.id);
        setFinalizeModel(true);
        setCurrentLead(l);
        return;
      }

      const request = await handleRequestSubmit(
        {
          status: newStatus,
          oldStatus: l.status,
          isAdmin: user.role === "ADMIN",
        },
        setToastLoading,
        `shared/client-leads/${l.id}/status`,
        false,
        "Updating",
        false,
        "PUT"
      );
      if (request.status === 200) {
        setRerenderColumns((prev) => ({
          ...prev,
          [l.status]: !prev[l.status],
          [newStatus]: !prev[newStatus],
        }));
      }
    }
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

      <Grid
        size={2}
        ref={drop}
        elevation={0}
        sx={{
          bgcolor: "grey.50",
          p: 0,
          minWidth: type === "STAFF" ? 280 : 280,
          height: "100vh",
          borderRadius: 0,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {loading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "#00000047",
              display: "flex",
              flexDirection: "column",
              zIndex: 1000,
            }}
          >
            <Box sx={{ width: "90%", mb: 2 }}>
              <LinearProgress
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#fff",
                  },
                }}
              />
            </Box>
          </Box>
        )}
        <ColumnHeader statusColor={statusColor}>
          <Stack spacing={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <BsKanban size={20} color={statusColor} />
              <Typography
                variant="h6"
                color="text.primary"
                sx={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                }}
              >
                {status.replace(/_/g, " ")}
              </Typography>
            </Box>

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <StatusChip
                label={`${totalLeads} ${totalLeads === 1 ? "lead" : "leads"}`}
                statuscolor={statusColor}
                size="small"
              />
              <Box display="flex" alignItems="center" gap={1}>
                <BiDollarCircle size={16} style={{ color: statusColor }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: statusColor,
                    bgcolor: `${statusColor}10`,
                    py: 0.5,
                    px: 1,
                    borderRadius: 1,
                    fontWeight: 500,
                  }}
                >
                  {totalValue}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </ColumnHeader>
        <Box
          onScroll={handleScroll}
          sx={{
            overflowY: "auto",
            flexGrow: 1,
            paddingTop: "8px",
            "::-webkit-scrollbar": {
              width: "6px",
            },
            "::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "4px",
            },
            "::-webkit-scrollbar-thumb": {
              background: "#bbb",
              borderRadius: "4px",
            },
            "::-webkit-scrollbar-thumb:hover": {
              background: "#999",
            },
          }}
        >
          <Stack spacing={1}>
            {leads?.map((lead) => {
              if (type === "STAFF") {
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
                  />
                );
              }
            })}
            {loading && (
              <Box
                sx={{
                  textAlign: "center",
                  color: "text.secondary",
                  padding: 2,
                }}
              >
                Loading leads...
              </Box>
            )}
            {!loading && hasMore && (
              <Box
                sx={{
                  textAlign: "center",
                  color: "text.secondary",
                  padding: 2,
                }}
              >
                Loading more leads...
              </Box>
            )}
          </Stack>
        </Box>
      </Grid>
    </>
  );
};

export default KanbanColumn;
