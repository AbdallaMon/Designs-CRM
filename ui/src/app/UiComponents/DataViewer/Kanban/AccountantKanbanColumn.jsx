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
import { useDrop } from "react-dnd";
import AccountantKanbanLeadCard from "./AccountantKanbanLeadCard";

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

const AccountantKanbanColumn = ({
  status,
  payments,
  moveCard,
  setPayments,
  statusArray,
}) => {
  const [, drop] = useDrop({
    accept: ItemTypes.CARD,
    drop: (item) => {
      moveCard(item, status, setPayments);
    },
  });

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
              label={`${payments.length} ${
                payments.length === 1 ? "Payment" : "payments"
              }`}
              statuscolor={statusColor}
              size="small"
            />
            <Box display="flex" alignItems="center" gap={1}>
              <BiDollarCircle size={16} style={{ color: statusColor }} />
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
          {payments.map((payment) => (
            <AccountantKanbanLeadCard
              key={payment.id}
              payment={payment}
              moveCard={moveCard}
              setPayments={setPayments}
              stausArray={statusArray}
            />
          ))}
        </Stack>
      </Box>
    </Grid>
  );
};

export default AccountantKanbanColumn;
