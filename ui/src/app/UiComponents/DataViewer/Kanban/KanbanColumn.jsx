"use client";
import { statusColors } from "@/app/helpers/constants";
import {
  Box,
  Chip,
  Grid2 as Grid,
  Stack,
  styled,
  Typography,
} from "@mui/material";
import { BiDollarCircle } from "react-icons/bi";
import { BsKanban } from "react-icons/bs";
import LeadCard from "./KanbanLeadCard";
import { useDrop } from "react-dnd";

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

const StatusChip = styled(Chip)(({ theme, statuscolor }) => ({
  backgroundColor: `${statuscolor}20`,
  color: statuscolor,
  fontWeight: 600,
  height: "24px",
  "& .MuiChip-label": {
    padding: "0 8px",
  },
}));

const KanbanColumn = ({ status, leads, movelead, admin, setleads }) => {
  const [, drop] = useDrop({
    accept: ItemTypes.CARD,
    drop: (item) => {
      movelead(item, status);
    },
  });

  const totalValue = leads.reduce(
    (acc, lead) => acc + parseFloat(lead.price.replace(/,/g, "") || 0),
    0
  );
  const statusColor = statusColors[status];

  return (
    <Grid
      size={2}
      ref={drop}
      elevation={0}
      sx={{
        bgcolor: "grey.50",
        p: 0,
        minWidth: 250,
        height: "100vh",
        borderRadius: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
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
              label={`${leads.length} ${leads.length === 1 ? "lead" : "leads"}`}
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
        sx={{
          overflowY: "auto",
          flexGrow: 1,
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
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              movelead={movelead}
              admin={admin}
              setleads={setleads}
            />
          ))}
        </Stack>
      </Box>
    </Grid>
  );
};

export default KanbanColumn;
