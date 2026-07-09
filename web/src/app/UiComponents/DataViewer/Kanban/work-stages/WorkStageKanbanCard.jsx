"use client";
import React, { useState } from "react";
import { useDrag } from "react-dnd";
import {
  Box,
  Button,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AiOutlineEllipsis as MoreVertIcon,
  AiOutlineEye as PreviewIcon,
  AiOutlineFileText as NoteIcon,
  AiOutlinePlus as AddIcon,
  AiOutlineSwap as ChangeStatusIcon,
} from "react-icons/ai";

import { statusColors } from "@/app/helpers/constants.js";
import { NewNoteDialog } from "@/app/UiComponents/DataViewer/leads/dialogs/NoteDialog";
import { checkIfAdmin } from "@/app/helpers/functions/utility.js";
import { FaEye } from "react-icons/fa";
import { useAuth } from "@/app/providers/AuthProvider";
import FloatingIdBadge from "@/app/UiComponents/DataViewer/leads/core/IdBadge";
import CountdownTimer from "@/app/UiComponents/DataViewer/leads/widgets/CountdownTimer";
import { NewCallDialog } from "@/app/UiComponents/DataViewer/leads/dialogs/CallsDialog";
import ClientImageSessionManager from "@/app/UiComponents/DataViewer/image-session/users/ClientSessionImageManager";
import TelegramLink from "../../work-stages/utility/TelegramLink";
import PreviewWorkStage from "../../work-stages/PreviewWorkStage";
import { KanbanUpdateSection } from "../../leads/leadUpdates/KanbanUpdateSection";
import { ProjectTasksDialog } from "../../work-stages/utility/ProjectTasksDialog";
import {
  GroupTitleChip,
  PriorityBadge,
  StyledCard,
  TasksContainer,
} from "./workStageKanbanStyles.js";
import TaskItem from "./TaskItem.jsx";
import TaskPreviewModal from "./TaskPreviewModal.jsx";
import DesignersPreviewModal from "./DesignersPreviewModal.jsx";

export { PriorityBadge } from "./workStageKanbanStyles.js";

const ItemTypes = {
  CARD: "card",
};

const WorkStageKanbanCard = ({
  lead,
  movelead,
  setleads,
  type,
  statusArray,
  setRerenderColumns,
  reRenderColumns,
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
  const admin = checkIfAdmin(user);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const [taskPreviewOpen, setTaskPreviewOpen] = useState(false);
  const [modificationPreviewOpen, setModificationPreviewOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedModification, setSelectedModification] = useState(null);

  const regularTasks = lead.projects?.[0]?.tasks || [];
  const modifications = lead.projects?.[0]?.modifications || [];
  const totalTasks = regularTasks.length || 0;
  const totalModifications = modifications.length || 0;
  const latestTasks = regularTasks.slice(0, 4);
  const latestModifications = modifications.slice(0, 4);
  const projectPriority = lead.projects?.[0]?.priority || "MEDIUM";

  // Get group information
  const groupId = lead.projects?.[0]?.groupId;
  const groupTitle = lead.projects?.[0]?.groupTitle;

  // Check if project should show modifications
  const shouldShowModifications =
    lead.projects?.[0]?.type === "3D_Modification" ||
    (lead.projects?.[0]?.type === "3D_Designer" &&
      lead.projects?.[0]?.status === "Modification");

  const handleMenuClick = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleStatusChange = async (newStatus) => {
    movelead(lead, newStatus);
  };

  const handleTaskPreview = (task) => {
    setSelectedTask(task);
    setTaskPreviewOpen(true);
  };

  const handleModificationPreview = (modification) => {
    setSelectedModification(modification);
    setModificationPreviewOpen(true);
  };

  return (
    <div ref={drag}>
      <StyledCard
        status={type === "STAFF" ? lead.status : lead.projects[0].status}
        groupId={groupId}
      >
        <FloatingIdBadge
          leadId={lead.id}
          backgroundColor={"white"}
          color={statusColors[lead.projects[0].status]}
          forceWhite={true}
        />
        {groupTitle && (
          <GroupTitleChip
            groupId={groupId}
            label={groupTitle}
            extra={{ top: 20 }}
          />
        )}

        <PriorityBadge
          priority={projectPriority}
          label={projectPriority.replace("_", " ")}
          extra={{ top: 20 }}
        />

        <CardContent sx={{ pt: 3 }}>
          <Box
            display="flex"
            gap={1}
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" component="div" sx={{ mb: 1 }}>
              {lead.client.name}
            </Typography>

            <ClientImageSessionManager clientLeadId={lead.id} />
            <Box my={1} display="flex" alignItems="center" gap={1}>
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
          </Box>
          <TelegramLink lead={lead} setleads={setleads} />

          {lead.projects && lead.projects[0] && (
            <Box
              sx={{
                mt: 1,
                mb: 2,
                p: 1,
                borderRadius: 1,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {admin && (
                <>
                  <DesignersPreviewModal lead={lead} />
                </>
              )}

              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid size={shouldShowModifications ? 4 : 6}>
                  <Typography variant="caption" color="text.secondary">
                    Delivery Time
                  </Typography>
                  <Typography variant="body2">
                    {lead.projects[0].deliverySchedules?.length > 0 ? (
                      <CountdownTimer
                        time={lead.projects[0].deliverySchedules[0].deliveryAt}
                      />
                    ) : (
                      <Typography variant="body2">Not set</Typography>
                    )}
                  </Typography>
                </Grid>
                <Grid size={shouldShowModifications ? 4 : 6}>
                  <Typography variant="caption" color="text.secondary">
                    Tasks
                  </Typography>
                  <Typography variant="body2">
                    {totalTasks} task{totalTasks !== 1 ? "s" : ""}
                  </Typography>
                </Grid>
                {shouldShowModifications && (
                  <Grid size={4}>
                    <Typography variant="caption" color="text.secondary">
                      Modifications
                    </Typography>
                    <Typography variant="body2">
                      {totalModifications} mod
                      {totalModifications !== 1 ? "s" : ""}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {/* Latest Tasks Section */}
              <Box sx={{ mt: 2 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="subtitle2" fontWeight="medium">
                    Updated Tasks
                  </Typography>
                  <ProjectTasksDialog
                    project={lead.projects[0]}
                    text="View all"
                    simple={true}
                  />
                </Box>
                {latestTasks.length > 0 && (
                  <TasksContainer>
                    {latestTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onPreview={handleTaskPreview}
                      />
                    ))}
                  </TasksContainer>
                )}
              </Box>

              {shouldShowModifications && (
                <Box sx={{ mt: 2 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight="medium"
                      color="warning.main"
                    >
                      Updated Modifications
                    </Typography>
                    <ProjectTasksDialog
                      project={lead.projects[0]}
                      text="View all"
                      type="MODIFICATION"
                      simple={true}
                    />
                  </Box>
                  {latestModifications.length > 0 && (
                    <TasksContainer
                      sx={{
                        backgroundColor: "#fff8e1",
                        borderColor: "#ffcc02",
                      }}
                    >
                      {latestModifications.map((modification) => (
                        <TaskItem
                          key={modification.id}
                          task={modification}
                          onPreview={handleModificationPreview}
                        />
                      ))}
                    </TasksContainer>
                  )}
                </Box>
              )}
            </Box>
          )}
          <KanbanUpdateSection
            lead={lead}
            setleads={setleads}
            currentUserDepartment={type}
            setRerenderColumns={setRerenderColumns}
            reRenderColumns={reRenderColumns}
          />
        </CardContent>
      </StyledCard>

      {!admin && (
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
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

      <PreviewWorkStage
        type={type}
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        setleads={setleads}
        id={lead.id}
        admin={admin}
        setRerenderColumns={setRerenderColumns}
      />

      <TaskPreviewModal
        open={taskPreviewOpen}
        onClose={() => setTaskPreviewOpen(false)}
        task={selectedTask}
        isModification={false}
      />

      <TaskPreviewModal
        open={modificationPreviewOpen}
        onClose={() => setModificationPreviewOpen(false)}
        task={selectedModification}
        isModification={true}
      />
    </div>
  );
};

export default WorkStageKanbanCard;
