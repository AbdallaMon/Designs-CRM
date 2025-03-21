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
import dayjs from "dayjs";
import { KanbanStatusArray, statusColors } from "@/app/helpers/constants.js";
import PreviewDialog from "@/app/UiComponents/DataViewer/leads/PreviewLead.jsx";
import {
  CallResultDialog,
  NewCallDialog,
  NewNoteDialog,
} from "@/app/UiComponents/DataViewer/leads/leadsDialogs.jsx";
import { hideMoreData } from "@/app/helpers/functions/utility.js";
import { FaEye } from "react-icons/fa";
import { InProgressCall } from "@/app/UiComponents/DataViewer/leads/InProgressCall.jsx";
import { useAuth } from "@/app/providers/AuthProvider";
import PreviewWorkStage from "../work-stages/PreviewWorkStage";

const ItemTypes = {
  CARD: "card",
};

const StyledCard = styled(Card)(({ theme, status }) => ({
  margin: theme.spacing(1),
  padding: theme.spacing(0.2),
  borderLeft: `5px solid ${statusColors[status]}`,
  transition: "all 0.3s",
  cursor: "grab",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: theme.shadows[4],
  },
  "&:active": {
    cursor: "grabbing",
  },
}));

const CallInfoBox = styled(Box)(({ theme, variant }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: variant === "next" ? "#e3f2fd" : "#f5f5f5",
  marginTop: theme.spacing(1),
}));

const LeadCard = ({ lead, movelead, admin, setleads, type, statusArray }) => {
  const [, drag] = useDrag({
    type: ItemTypes.CARD,
    item: {
      id: lead.id,
      status:
        type === "three-d"
          ? lead.threeDWorkStage
          : type === "two-d"
          ? lead.twoDWorkStage
          : type === "exacuter"
          ? lead.twoDExacuterStage
          : lead.status,
      ...lead,
    },
  });
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = React.useState(false);

  const handleMenuClick = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleStatusChange = async (newStatus) => {
    movelead(lead, newStatus);
  };

  // Process call reminders
  const getCallInfo = React.useCallback((callReminders) => {
    if (!callReminders || callReminders.length === 0) {
      return [];
    }

    const sortedCalls = [...callReminders].sort(
      (a, b) => new Date(b.time) - new Date(a.time)
    );
    return sortedCalls;
  }, []);

  const latestCalls = getCallInfo(lead.callReminders);
  return (
    <div ref={drag}>
      <StyledCard status={lead.status}>
        <CardContent>
          <Box>
            <Typography variant="h6" component="div">
              {lead.client.name}
            </Typography>
            <Typography variant="subtitle2" component="div">
              {lead.description}
            </Typography>
          </Box>
          <Box my={1} display="flex" alignItems="center" gap={1}>
            <Chip icon={<MoneyIcon />} label={lead.price} variant="outlined" />
            {!admin ? (
              <Tooltip title="Actions">
                <IconButton size="small" onClick={handleMenuClick}>
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Preview">
                <IconButton
                  size="small"
                  onClick={() => {
                    setPreviewDialogOpen(true);
                  }}
                >
                  <FaEye />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          {admin && lead.assingedTo && (
            <Box display="flex" alignItems="center" mb={2}>
              <UserIcon
                fontSize="small"
                sx={{ mr: 1, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                {lead.assingedTo.name}
              </Typography>
            </Box>
          )}
          <Stack spacing={2}>
            {latestCalls?.map((call, index) => {
              // if (
              //   user.role !== "ADMIN" &&
              //   user.role !== "SUPERVISOR" &&
              //   call.userId !== user.id
              // ) {
              //   return;
              // }
              return (
                <CallInfoBox
                  key={index}
                  variant={call.status === "IN_PROGRESS" && "next"}
                >
                  {call.status === "IN_PROGRESS" ? (
                    <InProgressCall call={call} simple={true} />
                  ) : (
                    <Box display="flex" alignItems="center" mb={1}>
                      <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">Last Call</Typography>
                    </Box>
                  )}
                  <Box pl={3}>
                    {call.status === "IN_PROGRESS" ? (
                      ""
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {dayjs(call.time).format("MMM D, YYYY HH:mm")}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      Reason: {hideMoreData(call.reminderReason) || "N/A"}
                    </Typography>
                    {call.result && (
                      <Typography variant="body2">
                        Result: {hideMoreData(call.callResult) || "N/A"}
                      </Typography>
                    )}
                    {!admin && call.status === "IN_PROGRESS" && (
                      <CallResultDialog
                        setleads={setleads}
                        lead={lead}
                        call={call}
                        type={"button"}
                        text={"Update call"}
                      ></CallResultDialog>
                    )}
                  </Box>
                </CallInfoBox>
              );
            })}
          </Stack>
        </CardContent>
      </StyledCard>
      {!admin && (
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
            <NewNoteDialog type="children" setleads={setleads} lead={lead}>
              <NoteIcon fontSize="small" sx={{ mr: 1 }} />
              Add Note
            </NewNoteDialog>
          </MenuItem>
          <MenuItem>
            <NewCallDialog type="children" setleads={setleads} lead={lead}>
              <AddIcon fontSize="small" sx={{ mr: 1 }} />
              Schedule Call
            </NewCallDialog>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setPreviewDialogOpen(true);
            }}
          >
            <Button
              sx={{
                display: "flex",
                gap: 1,
                justifyContent: "flex-start",
                width: "100%",
              }}
              variant={"text"}
            >
              <PreviewIcon fontSize="small" sx={{ mr: 1 }} />
              Preview Details
            </Button>
          </MenuItem>
          <Divider />
          <Box sx={{ px: 2, py: 1, bgcolor: "grey.50" }}>
            <Typography variant="caption" color="text.secondary">
              Change Status
            </Typography>
          </Box>
          {statusArray.map((status) => (
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
      )}
      {type === "three-d" || type === "two-d" || type === "exacuter" ? (
        <PreviewWorkStage
          type={type}
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          setleads={setleads}
          id={lead.id}
          admin={admin}
        />
      ) : (
        <PreviewDialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          setleads={setleads}
          id={lead.id}
          admin={admin}
        />
      )}
    </div>
  );
};

export default LeadCard;
