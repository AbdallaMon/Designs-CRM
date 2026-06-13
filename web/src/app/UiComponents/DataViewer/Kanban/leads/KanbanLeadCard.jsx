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
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  Checkbox,
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
import { CONTRACT_LEVELS, statusColors } from "@/app/helpers/constants.js";
import PreviewDialog from "@/app/UiComponents/DataViewer/leads/PreviewLeadDialog.jsx";
import { NewNoteDialog } from "@/app/UiComponents/DataViewer/leads/dialogs/NoteDialog";
import {
  CallResultDialog,
  NewCallDialog,
} from "@/app/UiComponents/DataViewer/leads/dialogs/CallsDialog.jsx";
import {
  checkIfAdminOrSuperSales,
  hideMoreData,
} from "@/app/helpers/functions/utility.js";
import { FaEye } from "react-icons/fa";
import { InProgressCall } from "@/app/UiComponents/DataViewer/leads/widgets/InProgressCall.jsx";
import { useAuth } from "@/app/providers/AuthProvider";
import PreviewWorkStage from "@/app/UiComponents/DataViewer/work-stages/PreviewWorkStage";
import FloatingIdBadge from "@/app/UiComponents/DataViewer/leads/core/IdBadge";

import { KanbanUpdateSection } from "@/app/UiComponents/DataViewer/leads/leadUpdates/KanbanUpdateSection";
import ClientImageSessionManager from "@/app/UiComponents/DataViewer/image-session/users/ClientSessionImageManager";
import { contractLevelColors } from "@/app/helpers/colors";
import { IoMdContract } from "react-icons/io";

const ItemTypes = {
  CARD: "card",
};

const StyledCard = styled(Card)(({ theme, borderColor }) => ({
  margin: theme.spacing(1),
  padding: theme.spacing(0.2),
  paddingLeft: theme.spacing(0.15),
  borderLeft: `5px solid ${borderColor}`,
  transition: "all 0.3s",
  position: "relative",
  cursor: "grab",
  overflow: "unset",
  "& .MuiCardContent-root": {
    paddingLeft: "10px",
    overflow: "hidden",
  },
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

const LeadCard = ({
  lead,
  movelead,
  setleads,
  type,
  statusArray,
  setRerenderColumns,
  reRenderColumns,
  selectedLeads = [],
  setSelectedLeads = () => {},
}) => {
  const [, drag] = useDrag({
    type: ItemTypes.CARD,
    item: {
      id: lead.id,
      status:
        type === "STAFF" || type === "CONTRACTLEVELS"
          ? lead.status
          : lead.projects[0].status,
      ...lead,
    },
  });
  const { user } = useAuth();
  const admin = checkIfAdminOrSuperSales(user);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);

  const isSelected = selectedLeads.includes(lead.id);
  const showCheckbox = admin && (hovered || selectedLeads.length > 0);

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    setSelectedLeads((prev) =>
      isSelected ? prev.filter((id) => id !== lead.id) : [...prev, lead.id]
    );
  };

  const handleMenuClick = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleStatusChange = async (newStatus) => {
    if (type === "CONTRACTLEVELS") return;
    await movelead(lead, newStatus);
  };

  const getCallInfo = React.useCallback((callReminders) => {
    if (!callReminders || callReminders.length === 0) {
      return [];
    }

    const sortedCalls = [...callReminders].sort(
      (a, b) => new Date(b.time) - new Date(a.time)
    );
    return sortedCalls;
  }, []);

  const getDateRange = () => {
    if (lead.projects && lead.projects[0]) {
      const project = lead.projects[0];
      if (project.startedAt && project.endedAt) {
        return `${dayjs(project.startedAt).format("MMM D")} - ${dayjs(
          project.endedAt
        ).format("MMM D, YYYY")}`;
      }
    }
    return null;
  };

  const latestCalls = getCallInfo(lead.callReminders);
  const dateRange = getDateRange();
  const currentContract =
    lead.contracts && lead.contracts.length > 0 && lead.contracts[0];
  const levelColor = currentContract
    ? contractLevelColors[currentContract.contractLevel]
    : "#000000";
  return (
    <div
      ref={drag}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <StyledCard
        borderColor={
          type === "STAFF" || type === "CONTRACTLEVELS"
            ? levelColor
            : statusColors[lead.projects[0].status]
        }
      >
        {showCheckbox && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 1001,
            }}
          >
            <Checkbox
              checked={isSelected}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              sx={{
                color: isSelected ? "primary.main" : "action.disabled",
              }}
            />
          </Box>
        )}
        <FloatingIdBadge
          leadId={lead.id}
          backgroundColor={`${levelColor}60`}
          color={levelColor}
        />

        <Box
          sx={{
            position: "absolute",
            top: -20,
            right: 0,
            zIndex: 1000,
          }}
        >
          <Chip
            icon={<IoMdContract sx={{ fontSize: "12px !important" }} />}
            label={
              currentContract
                ? CONTRACT_LEVELS[currentContract.contractLevel]
                : "No Contract"
            }
            sx={{
              fontWeight: "bold",
              fontSize: "0.875rem",
              color: levelColor,
              bgcolor: levelColor + "60",
              borderRadius: "0",
              cursor: "default",
              userSelect: "none",
            }}
          />
        </Box>

        <CardContent>
          <Box>
            <Typography variant="h6" component="div">
              {lead.client.name}
            </Typography>
            <ClientImageSessionManager clientLeadId={lead.id} />
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
          {admin && lead.assignedTo && (
            <Box display="flex" alignItems="center" mb={2}>
              <UserIcon
                fontSize="small"
                sx={{ mx: 1, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                {lead.assignedTo.name}
              </Typography>
            </Box>
          )}

          {user.role !== "STAFF" && lead.projects && lead.projects[0] && (
            <Box
              sx={{
                mt: 1,
                mb: 2,
                p: 1.5,
                borderRadius: 1,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Grid container spacing={1}>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body2">
                    {lead.projects[0].status || "To Do"}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Priority
                  </Typography>
                  <Typography variant="body2">
                    {lead.projects[0].priority || "MEDIUM"}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Delivery Time
                  </Typography>
                  <Typography variant="body2">
                    {lead.projects[0].deliveryTime
                      ? dayjs(lead.projects[0].deliveryTime).format(
                          "MMM D, YYYY"
                        )
                      : "Not set"}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Area
                  </Typography>
                  <Typography variant="body2">
                    {lead.projects[0].area
                      ? `${lead.projects[0].area} m²`
                      : "Not set"}
                  </Typography>
                </Grid>
                <Grid>
                  <Typography variant="caption" color="text.secondary">
                    Timeline
                  </Typography>
                  <Typography variant="body2">
                    {dateRange
                      ? dateRange
                      : lead.projects[0].startedAt
                      ? `Started: ${dayjs(lead.projects[0].startedAt).format(
                          "MMM D, YYYY"
                        )}`
                      : lead.projects[0].endedAt
                      ? `End: ${dayjs(lead.projects[0].endedAt).format(
                          "MMM D, YYYY"
                        )}`
                      : "Not started / In progress"}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          <Stack spacing={2}>
            {latestCalls?.map((call, index) => {
              if (
                user.role !== "ADMIN" &&
                user.role !== "SUPER_ADMIN" &&
                user.role !== "STAFF" &&
                call.userId !== user.id
              ) {
                return;
              }
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
                    {call.status === "IN_PROGRESS" && (
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
          <KanbanUpdateSection
            lead={lead}
            setleads={setleads}
            currentUserDepartment="STAFF"
            setRerenderColumns={setRerenderColumns}
            reRenderColumns={reRenderColumns}
            type={type}
          />
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

      {type === "STAFF" || type === "CONTRACTLEVELS" ? (
        <PreviewDialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          setleads={setleads}
          id={lead.id}
          setRerenderColumns={setRerenderColumns}
          admin={admin}
        />
      ) : (
        <PreviewWorkStage
          type={type}
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          setleads={setleads}
          id={lead.id}
          admin={admin}
          setRerenderColumns={setRerenderColumns}
        />
      )}
    </div>
  );
};

export default LeadCard;
