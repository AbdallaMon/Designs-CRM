"use client";
import React, { useState } from "react";
import { useDrag } from "react-dnd";
import {
  Avatar, Badge, Box, CardContent, Chip, Divider, IconButton,
  Menu, MenuItem, Tooltip, Typography,
} from "@mui/material";
import {
  AiOutlineEllipsis as MoreVertIcon,
  AiOutlineEye as PreviewIcon,
  AiOutlineFileText as NoteIcon,
  AiOutlinePlus as AddIcon,
  AiOutlineSwap as ChangeStatusIcon,
} from "react-icons/ai";
import { MdOpenInNew } from "react-icons/md";
import Link from "next/link";

import { statusColors } from "@/app/helpers/constants";
import { NewNoteDialog } from "@/features/leads/dialogs/NoteDialog";
import { NewCallDialog } from "@/features/leads/dialogs/CallsDialog";
import { checkIfAdmin } from "@/app/helpers/functions/utility.js";
import { useAuth } from "@/app/providers/AuthProvider";
import { usePermission } from "@/app/hooks/usePermission";
import { LEAD_CODES } from "@/app/helpers/permissionCodes";
import FloatingIdBadge from "@/features/leads/core/IdBadge";
import ClientImageSessionManager from "@/features/image-session/users/ClientSessionImageManager";
import TelegramLink from "@/features/work-stages/utility/TelegramLink.jsx";
import PreviewWorkStage from "@/features/work-stages/PreviewWorkStage.jsx";
import { KanbanUpdateSection } from "@/features/leads/leadUpdates/KanbanUpdateSection.jsx";
import {
  GroupTitleChip, PriorityBadge, StyledCard,
} from "@/features/Kanban/work-stages/workStageKanbanStyles.js";
import { useUnseenActivity } from "@/features/Kanban/work-stages/cardMeta.js";
import {
  AgingBadge, NextActionLine, StageProgress,
} from "@/features/Kanban/work-stages/WorkStageCardSignals.jsx";

export { PriorityBadge } from "@/features/Kanban/work-stages/workStageKanbanStyles.js";

const ItemTypes = { CARD: "card" };

const WorkStageKanbanCard = ({
  lead, movelead, setleads, type, statusArray, setRerenderColumns, reRenderColumns,
}) => {
  const [, drag] = useDrag({
    type: ItemTypes.CARD,
    item: {
      id: lead.id,
      status: type === "STAFF" ? lead.status : lead.projects[0].status,
      ...lead,
    },
  });

  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const admin = checkIfAdmin(user);
  // Sales/admin-tier view (lead.assign.other == admin-tier operator set): shows the
  // assignee avatar + deal-value chip. Designers see the priority chip instead.
  const isSalesView = hasPermission(LEAD_CODES.ASSIGN_OTHER);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const project = lead.projects?.[0];
  const cardMeta = project?.cardMeta;
  // capability-with-fallback: undecorated legacy rows keep master behavior (non-admin menu)
  const canChangeStatus = project?.capabilities
    ? Boolean(project.capabilities.canChangeStatus)
    : !admin;
  const assignee = project?.assignments?.[0]?.user;
  const { hasUnseen, markSeen } = useUnseenActivity(lead.id, cardMeta?.latestActivityAt);

  const openPreview = () => {
    markSeen();
    setPreviewDialogOpen(true);
  };

  if (!project) return null;

  return (
    <div ref={drag}>
      <StyledCard status={type === "STAFF" ? lead.status : project.status} groupId={project.groupId}>
        <FloatingIdBadge
          leadId={lead.id}
          backgroundColor={"white"}
          color={statusColors[project.status]}
          forceWhite={true}
        />
        {project.groupTitle && (
          <GroupTitleChip groupId={project.groupId} label={project.groupTitle} extra={{ top: 20 }} />
        )}
        {!isSalesView && (
          <PriorityBadge
            priority={project.priority || "MEDIUM"}
            label={(project.priority || "MEDIUM").replace("_", " ")}
            extra={{ top: 20 }}
          />
        )}

        <CardContent sx={{ pt: 3, pb: "12px !important" }}>
          {/* header: client + unseen dot + actions */}
          <Box display="flex" gap={1} justifyContent="space-between" alignItems="center">
            <Badge color="secondary" variant="dot" invisible={!hasUnseen} overlap="rectangular">
              <Typography variant="h6" component="div" noWrap>
                {lead.client.name}
              </Typography>
            </Badge>
            <ClientImageSessionManager clientLeadId={lead.id} />
            <Box display="flex" alignItems="center" gap={0.5}>
              <Tooltip title="Preview">
                <IconButton size="small" onClick={openPreview}>
                  <PreviewIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Actions">
                <IconButton size="small" onClick={(e) => setMenuAnchorEl(e.currentTarget)}>
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* sales/admin: value + assignee row */}
          {isSalesView && (
            <Box display="flex" alignItems="center" gap={1} mt={0.5} flexWrap="wrap">
              {(lead.averagePrice || lead.price) && (
                <Chip
                  size="small"
                  label={`AED ${Number(lead.averagePrice || lead.price).toLocaleString()}`}
                  variant="outlined"
                  sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
                />
              )}
              {assignee && (
                <Tooltip title={assignee.name}>
                  <Avatar sx={{ width: 22, height: 22, fontSize: "0.7rem" }}>
                    {assignee.name?.charAt(0)}
                  </Avatar>
                </Tooltip>
              )}
            </Box>
          )}

          <TelegramLink lead={lead} setleads={setleads} />

          {/* the triage signals */}
          <NextActionLine cardMeta={cardMeta} />
          <StageProgress status={project.status} statusArray={statusArray} />
          <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
            <AgingBadge status={project.status} cardMeta={cardMeta} />
            <Typography variant="caption" color="text.secondary">
              {project.tasks?.length || 0} open task{(project.tasks?.length || 0) === 1 ? "" : "s"}
            </Typography>
          </Box>

          <KanbanUpdateSection
            lead={lead}
            setleads={setleads}
            currentUserDepartment={type}
            setRerenderColumns={setRerenderColumns}
            reRenderColumns={reRenderColumns}
          />
        </CardContent>
      </StyledCard>

      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={() => setMenuAnchorEl(null)}>
        <MenuItem onClick={openPreview}>
          <PreviewIcon fontSize="small" style={{ marginRight: 8 }} /> Preview
        </MenuItem>
        <MenuItem component={Link} href={`/dashboard/projects/${project.id}`}>
          <MdOpenInNew fontSize="small" style={{ marginRight: 8 }} /> Open project page
        </MenuItem>
        <MenuItem onClick={() => {}}>
          <NewNoteDialog type="children" setleads={setleads} lead={lead}>
            <NoteIcon fontSize="small" style={{ marginRight: 8 }} /> Add Note
          </NewNoteDialog>
        </MenuItem>
        <MenuItem>
          <NewCallDialog type="children" setleads={setleads} lead={lead}>
            <AddIcon fontSize="small" style={{ marginRight: 8 }} /> Schedule Call
          </NewCallDialog>
        </MenuItem>
        {canChangeStatus && <Divider />}
        {canChangeStatus && (
          <Box sx={{ px: 2, py: 1, bgcolor: "grey.50" }}>
            <Typography variant="caption" color="text.secondary">Change Status</Typography>
          </Box>
        )}
        {canChangeStatus &&
          statusArray.map((status) => (
            <MenuItem
              key={status}
              onClick={() => {
                setMenuAnchorEl(null);
                movelead(lead, status);
              }}
              sx={{
                color: statusColors[status],
                "&:hover": { backgroundColor: statusColors[status] + "20" },
              }}
            >
              <ChangeStatusIcon fontSize="small" style={{ marginRight: 8 }} />
              {status.replace(/_/g, " ")}
            </MenuItem>
          ))}
      </Menu>

      <PreviewWorkStage
        type={type}
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        setleads={setleads}
        id={lead.id}
        admin={admin}
        setRerenderColumns={setRerenderColumns}
      />
    </div>
  );
};

export default WorkStageKanbanCard;
