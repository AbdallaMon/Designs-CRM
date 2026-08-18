"use client";
import { KANBAN_VIEW_TYPES, WORK_DEPARTMENTS } from "@dms/shared";
import React from "react";
import { useDrag } from "react-dnd";
import {
  Box,
  Button,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  Checkbox,
} from "@mui/material";
import {
  AiOutlineDollar as MoneyIcon,
  AiOutlineEllipsis as MoreVertIcon,
  AiOutlineEye as PreviewIcon,
  AiOutlineFileText as NoteIcon,
  AiOutlinePlus as AddIcon,
  AiOutlineSwap as ChangeStatusIcon,
  AiOutlineUser as UserIcon,
} from "react-icons/ai";
import { CONTRACT_LEVELS, statusColors } from "@/app/helpers/constants";
import PreviewDialog from "@/features/leads/PreviewLeadDialog.jsx";
import { NewNoteDialog } from "@/features/leads/dialogs/NoteDialog";
import {
  NewCallDialog,
} from "@/features/leads/dialogs/CallsDialog.jsx";
import { FaEye } from "react-icons/fa";
import { usePermission } from "@/app/hooks/usePermission";
import { LEAD_CODES } from "@/app/helpers/permissionCodes";
import PreviewWorkStage from "@/features/work-stages/PreviewWorkStage";
import FloatingIdBadge from "@/features/leads/core/IdBadge";

import { KanbanUpdateSection } from "@/features/leads/leadUpdates/KanbanUpdateSection";
import ClientImageSessionManager from "@/features/image-session/users/ClientSessionImageManager";
import { contractLevelColors } from "@/app/helpers/colors";
import { IoMdContract } from "react-icons/io";
import { StyledCard } from "@/features/Kanban/leads/kanbanLeadCardStyles.js";
import {
  ContractWorkSummary,
  DealNextActionLine,
  formatAed,
  LatestActivityLine,
} from "@/features/Kanban/leads/LeadCardSignals.jsx";
import {
  getCurrentContractStage,
  getLatestLeadActivity,
  getLeadAgeDays,
  getLeadNextAction,
} from "@/features/Kanban/leads/lead-card-signals.js";

const ItemTypes = {
  CARD: "card",
};

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
        type === KANBAN_VIEW_TYPES.STAFF ||
        type === KANBAN_VIEW_TYPES.CONTRACT_LEVELS
          ? lead.status
          : lead.projects[0].status,
      ...lead,
    },
  });
  const { hasPermission } = usePermission();
  // lead.assign.other is granted to exactly ADMIN/SUPER_ADMIN + isSuperSales
  // (see permission-profiles-phase3-leads plan) — equivalent to checkIfAdminOrSuperSales
  // for base roles; also honors admin/super-admin subRoles (affordance-only, backend enforces).
  const admin = hasPermission(LEAD_CODES.ASSIGN_OTHER);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = React.useState(false);
  const [previewSection, setPreviewSection] = React.useState("details");
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
    if (type === KANBAN_VIEW_TYPES.CONTRACT_LEVELS) return;
    await movelead(lead, newStatus);
  };
  const openPreview = (section = "details") => {
    setPreviewSection(section);
    setPreviewDialogOpen(true);
  };
  const currentContract =
    lead.contracts && lead.contracts.length > 0 && lead.contracts[0];
  const projectBoard = type === KANBAN_VIEW_TYPES.CONTRACT_LEVELS;
  const nextAction = getLeadNextAction(lead.callReminders);
  const latestActivity = getLatestLeadActivity(lead);
  const leadAgeDays = getLeadAgeDays(lead.createdAt);
  const currentContractStage = getCurrentContractStage(currentContract);
  const value =
    currentContract?.totalAmount ??
    currentContract?.amount ??
    lead.averagePrice ??
    lead.price;
  const levelColor = currentContract
    ? contractLevelColors[currentContract.contractLevel]
    : "#000000";
  const statusColor =
    type === KANBAN_VIEW_TYPES.STAFF ||
    type === KANBAN_VIEW_TYPES.CONTRACT_LEVELS
      ? lead.status && statusColors[lead.status]
      : statusColors[lead.projects?.[0]?.status];
  const accentColor =
    currentContract && levelColor !== "#000000"
      ? levelColor
      : statusColor || "#c7a16a";
  return (
    <div
      ref={drag}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <StyledCard borderColor={accentColor}>
        <FloatingIdBadge
          leadId={lead.id}
          backgroundColor={`${accentColor}1f`}
          color={accentColor}
        />

        <Box
          sx={{
            position: "absolute",
            top: -16,
            right: 8,
            zIndex: 1000,
          }}
        >
          <Chip
            size="small"
            icon={
              <IoMdContract
                style={{ fontSize: "13px", color: "inherit" }}
              />
            }
            label={
              currentContract
                ? CONTRACT_LEVELS[currentContract.contractLevel]
                : "No Contract"
            }
            sx={{
              fontWeight: 700,
              fontSize: "0.72rem",
              height: "26px",
              color: "#fff",
              bgcolor: currentContract ? levelColor : "#9a8e82",
              boxShadow: "0 2px 6px rgba(42,34,26,0.18)",
              borderRadius: "13px",
              cursor: "default",
              userSelect: "none",
              "& .MuiChip-icon": { color: "#fff", marginLeft: "6px" },
            }}
          />
        </Box>

        <CardContent>
          <Box
            display="flex"
            alignItems="flex-start"
            justifyContent="space-between"
            gap={1}
          >
            {admin && (
              <Box
                sx={{
                  flexShrink: 0,
                  opacity: showCheckbox ? 1 : 0,
                  pointerEvents: showCheckbox ? "auto" : "none",
                  transition: "opacity 0.15s ease",
                }}
              >
                <Checkbox
                  size="small"
                  checked={isSelected}
                  onChange={handleCheckboxChange}
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    color: isSelected ? "primary.main" : "action.disabled",
                    p: 0.5,
                    mt: -0.5,
                    ml: -0.5,
                  }}
                />
              </Box>
            )}
            <Typography
              variant="subtitle1"
              component="div"
              sx={{
                fontWeight: 700,
                lineHeight: 1.3,
                color: "text.primary",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                wordBreak: "break-word",
              }}
              title={lead.client.name}
            >
              {lead.client.name}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                flexShrink: 0,
              }}
            >
              <ClientImageSessionManager clientLeadId={lead.id} compact />
              <Tooltip title="View details">
                <IconButton
                  aria-label="View details"
                  size="small"
                  onClick={() => openPreview("details")}
                  sx={{
                    mt: -0.5,
                    mr: -0.5,
                    flexShrink: 0,
                    color: accentColor,
                  }}
                >
                  <FaEye />
                </IconButton>
              </Tooltip>
              {!admin && (
                <Tooltip title="Actions">
                  <IconButton
                    aria-label="Deal actions"
                    size="small"
                    onClick={handleMenuClick}
                    sx={{ mt: -0.5, mr: -0.5 }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          <Box
            display="flex"
            alignItems="center"
            flexWrap="wrap"
            gap={0.75}
            mb={admin && lead.assignedTo ? 1 : 1.5}
          >
            <Chip
              size="small"
              icon={<MoneyIcon />}
              label={formatAed(value)}
              sx={{
                fontWeight: 700,
                color: "success.dark",
                bgcolor: "rgba(107, 140, 90, 0.12)",
                border: "1px solid rgba(107, 140, 90, 0.25)",
                "& .MuiChip-icon": { color: "success.dark" },
              }}
            />
          </Box>

          {admin && lead.assignedTo && (
            <Box
              display="flex"
              alignItems="center"
              gap={0.75}
              mb={1.5}
              sx={{
                bgcolor: "action.hover",
                borderRadius: "8px",
                px: 1,
                py: 0.5,
                width: "fit-content",
              }}
            >
              <UserIcon style={{ fontSize: 14, color: "#7a6f63" }} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600 }}
              >
                {lead.assignedTo.name}
              </Typography>
            </Box>
          )}

          {projectBoard ? (
            <ContractWorkSummary stage={currentContractStage} />
          ) : (
            <DealNextActionLine
              action={nextAction}
              onOpenCalls={() => openPreview("calls")}
            />
          )}

          <LatestActivityLine activity={latestActivity} ageDays={leadAgeDays} />

          <KanbanUpdateSection
            lead={lead}
            setleads={setleads}
            currentUserDepartment={WORK_DEPARTMENTS.STAFF}
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
              openPreview("details");
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
          {!projectBoard && <Divider />}
          {!projectBoard && (
            <Box sx={{ px: 2, py: 1, bgcolor: "grey.50" }}>
              <Typography variant="caption" color="text.secondary">
                Change Status
              </Typography>
            </Box>
          )}
          {!projectBoard &&
            statusArray.map((status) => (
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

      {type === KANBAN_VIEW_TYPES.STAFF ||
      type === KANBAN_VIEW_TYPES.CONTRACT_LEVELS ? (
        <PreviewDialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          setleads={setleads}
          id={lead.id}
          setRerenderColumns={setRerenderColumns}
          admin={admin}
          initialSection={previewSection}
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
