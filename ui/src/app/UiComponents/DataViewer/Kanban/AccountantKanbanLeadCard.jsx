"use client";
import React from "react";
import { useDrag } from "react-dnd";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AiOutlineDollar as MoneyIcon,
  AiOutlineEllipsis as MoreVertIcon,
  AiOutlineEye as PreviewIcon,
  AiOutlineFileText as NoteIcon,
  AiOutlinePhone as PhoneIcon,
  AiOutlinePlus as AddIcon,
  AiOutlineSwap as ChangeStatusIcon,
  AiOutlineUser as UserIcon,
} from "react-icons/ai";

import { styled } from "@mui/material/styles";
import { statusColors } from "@/app/helpers/constants.js";

import { MdOutlinePayments } from "react-icons/md";
import CreateModal from "../../models/CreateModal";
import { PaymentHistoryModal } from "../accountant/payments/PaymentsCalendar";
import ConfirmWithActionModel from "../../models/ConfirmsWithActionModel";
import Link from "next/link";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

const ItemTypes = {
  CARD: "card",
};

const StyledCard = styled(Card)(({ theme, status }) => ({
  margin: theme.spacing(1),
  borderRadius: theme.spacing(1),
  borderLeft: `5px solid ${statusColors[status]}`,
  transition: "all 0.3s ease",
  cursor: "grab",
  overflow: "visible",
  position: "relative",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
  },
  "&:active": {
    cursor: "grabbing",
    transform: "translateY(-2px)",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  },
  "&:before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "4px",
    backgroundColor: statusColors[status],
    borderTopLeftRadius: theme.spacing(1),
    borderTopRightRadius: theme.spacing(1),
  },
}));
const inputs = [
  {
    data: { id: "amount", label: "Amount to be paid", type: "number" },
    pattern: { required: { value: true, message: "Amount is required" } },
  },
  {
    data: {
      id: "issuedDate",
      label: "Payment date",
      type: "date",
    },
    pattern: { required: { value: true, message: "Date is required" } },
  },
  {
    data: {
      id: "file",
      label: "Attatchment",
      type: "file",
    },
    pattern: { required: { value: true, message: "Attatchment is required" } },
  },
  {
    data: { id: "paymentId", key: "id", type: "number" },
    sx: { display: "none" },
  },
];

const AccountantKanbanLeadCard = ({
  payment,
  moveCard,
  setPayments,
  stausArray,
  type,
}) => {
  const [, drag] = useDrag({
    type: ItemTypes.CARD,
    item: {
      id: payment.id,
      ...payment,
    },
  });
  const { setLoading } = useToastContext();
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const handleMenuClick = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleStatusChange = async (newStatus) => {
    moveCard(payment, newStatus, setPayments);
  };
  function handleAfterEdit(newData) {
    if (newData.status === "FULLY_PAID" || newData.amountLeft === 0) {
      setPayments((payments) =>
        payments.filter((payment) => {
          return payment.id !== newData.id;
        })
      );
    } else {
      setPayments((payments) =>
        payments.map((payment) => {
          if (payment.id === newData.id) {
            payment.amountPaid = newData.amountPaid;
            payment.status = newData.status;
            payment.amountLeft = newData.amountLeft;
          }
          return payment;
        })
      );
    }
    return newData;
  }
  async function overDuePayment(id) {
    const request = await handleRequestSubmit(
      {},
      setLoading,
      `accountant/payments/overdue/${id}`,
      false,
      "Marking as over due"
    );
    if (request.status === 200) {
      const newPayments = data.map((payment) => {
        if (payment.id === id) {
          payment.status = "OVERDUE";
        }
        return payment;
      });
      setPayments(newPayments);
    }
  }

  async function handleBeforeSubmit(data) {
    if (
      data.amount > payment.amountLeft &&
      data.amount > payment.amount - payment.amountPaid
    ) {
      throw new Error(
        "Error amount left is more than input ,Amount left is :" +
          payment.amountLeft
      );
    }
    const formData = new FormData();
    formData.append("file", data.file[0]);
    const fileUpload = await handleRequestSubmit(
      formData,
      setLoading,
      "utility/upload",
      true,
      "Uploading file"
    );
    data.file = fileUpload.fileUrls.file[0];
    return data;
  }

  return (
    <div ref={drag}>
      <StyledCard
        status={
          type === "three-d"
            ? payment.clientLead.threeDWorkStage
            : payment.paymentLevel
        }
      >
        <CardContent sx={{ padding: 2 }}>
          {/* Add proper spacing between sections */}
          <Box mb={2}>
            <Typography variant="h6" component="div" gutterBottom>
              {payment.clientLead.client.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {payment.clientLead.description}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              <strong>Payment reason:</strong> {payment.paymentReason}
            </Typography>
          </Box>

          <Box mb={2}>
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle2" component="div">
                <strong>Amount:</strong> ${payment.amount}
              </Typography>
              <Typography variant="subtitle2" component="div">
                <strong>Paid:</strong> ${payment.amountPaid}
              </Typography>
            </Stack>

            <Box mb={2}>
              <Stack direction="row" justifyContent="flex-end">
                <Typography variant="body2" fontWeight="medium">
                  {Math.round((payment.amountPaid / payment.amount) * 100)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={(payment.amountPaid / payment.amount) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: `${statusColors[payment.status]}20`,
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: statusColors[payment.status],
                  },
                }}
              />
            </Box>
          </Box>

          <Box>
            <Chip
              icon={<MdOutlinePayments />}
              label={payment.clientLead.threeDWorkStage}
              variant="filled"
              size="small"
              sx={{
                backgroundColor: `${
                  statusColors[payment.clientLead.threeDWorkStage]
                }20`,
                color: statusColors[payment.status],
                fontWeight: "bold",
                "& .MuiChip-icon": {
                  color: statusColors[payment.clientLead.threeDWorkStage],
                },
              }}
            />
            <Tooltip title="Actions">
              <IconButton size="small" onClick={handleMenuClick} sx={{ ml: 1 }}>
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </StyledCard>
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {/* Status menu header */}
        <Box sx={{ px: 2, py: 1, bgcolor: "grey.50" }}>
          <Typography variant="caption" color="text.secondary">
            Available Actions
          </Typography>
        </Box>

        <MenuItem onClick={() => {}}>
          <CreateModal
            withClose={true}
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <MdOutlinePayments />
                <Typography>Pay</Typography>
              </Stack>
            }
            inputs={inputs}
            href={`accountant/payments/pay/${payment.id}`}
            handleSubmit={(data) => {
              handleAfterEdit(data);
            }}
            handleBeforeSubmit={handleBeforeSubmit}
            setData={setPayments}
            extraProps={{
              formTitle: `Payment number # ${payment.id}`,
              btnText: "Pay",
              variant: "outlined",
            }}
          />
        </MenuItem>
        <MenuItem>
          <PaymentHistoryModal payment={payment} />
        </MenuItem>
        <MenuItem>
          <ConfirmWithActionModel
            label="Mark as over due"
            title="Mark payment as over due"
            description="Are you sure you want to mark this payment as over due?"
            handleConfirm={() => overDuePayment(payment.id)}
          />
        </MenuItem>
        <MenuItem>
          <Button
            component={Link}
            href={"/dashboard/deals/" + payment.clientLead.id}
          >
            View Details
          </Button>
        </MenuItem>
        <Divider />
        <Box sx={{ px: 2, py: 1, bgcolor: "grey.50" }}>
          <Typography variant="caption" color="text.secondary">
            Change Status
          </Typography>
        </Box>
        {stausArray &&
          stausArray.length > 0 &&
          stausArray.map((status) => (
            <MenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              sx={{
                color: statusColors[status],
                "&:hover": {
                  backgroundColor: statusColors[status] + "20",
                },
              }}
            >
              <ChangeStatusIcon fontSize="small" sx={{ mr: 1 }} />
              {status.replace(/_/g, " ")}
            </MenuItem>
          ))}
      </Menu>
    </div>
  );
};

export default AccountantKanbanLeadCard;
