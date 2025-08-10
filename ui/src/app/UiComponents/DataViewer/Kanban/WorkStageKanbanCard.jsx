"use client";
import React, { useState } from "react";
import { useDrag } from "react-dnd";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid2,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
  Badge,
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
import {
  groupColors,
  priorityColors,
  statusColors,
  taskStatusColors,
} from "@/app/helpers/constants.js";
import {
  NewCallDialog,
  NewNoteDialog,
} from "@/app/UiComponents/DataViewer/leads/leadsDialogs.jsx";
import { checkIfAdmin } from "@/app/helpers/functions/utility.js";
import { FaEye } from "react-icons/fa";
import { useAuth } from "@/app/providers/AuthProvider";
import PreviewWorkStage from "../work-stages/PreviewWorkStage";
import {
  MdAdd,
  MdAssignmentInd,
  MdDelete,
  MdTask,
  MdVisibility,
} from "react-icons/md";
import { StyledDesignerCard } from "../work-stages/projects/ProjectDetails";
import { AssignDesignerModal } from "../work-stages/projects/AssignDesignerModal";
import { ProjectTasksDialog } from "../work-stages/utility/ProjectTasksDialog";
import TaskDetails from "../utility/TaskDetails";
import colors from "@/app/helpers/colors";
import TelegramLink from "../work-stages/utility/TelegramLink";
import FloatingIdBadge from "../leads/extra/IdBadge";
import { KanbanUpdateSection } from "../leads/leadUpdates/KanbanUpdateSection";
import ClientImageSessionManager from "../image-session/users/ClientSessionImageManager";
import CountdownTimer from "../leads/extra/CountdownTimer";

const ItemTypes = {
  CARD: "card",
};

const StyledCard = styled(Card)(({ theme, status, groupId }) => {
  const groupColor = groupColors[groupId] || groupColors[0];

  return {
    margin: theme.spacing(1),
    padding: 1,
    paddingLeft: theme.spacing(0.15),
    borderLeft: `5px solid ${statusColors[status]}`,
    borderTop: `3px solid ${groupColor.border}`,
    backgroundColor: groupColor.bg,
    transition: "all 0.3s",
    cursor: "grab",
    position: "relative",
    overflow: "unset",
    paddingTop: "15px",
    "& .MuiCardContent-root": {
      paddingLeft: "10px",
      paddingRight: "4px",
      overflow: "hidden",
    },
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: theme.shadows[4],
    },
    "&:active": {
      cursor: "grabbing",
    },
  };
});

export const PriorityBadge = styled(Chip)(
  ({ theme, priority, task = false, extra }) => ({
    position: "absolute",
    top: 8,
    right: task ? 32 : 8,
    zIndex: 2,
    fontSize: "0.7rem",
    height: "22px",
    ...(extra && extra),
    backgroundColor: priorityColors[priority]?.bg || priorityColors.MEDIUM.bg,
    color: priorityColors[priority]?.color || priorityColors.MEDIUM.color,
    border: `1px solid ${
      priorityColors[priority]?.border || priorityColors.MEDIUM.border
    }`,
    fontWeight: 600,
    "& .MuiChip-label": {
      padding: "0 6px",
    },
  })
);

const GroupTitleChip = styled(Chip)(({ theme, groupId, extra }) => {
  const groupColor = groupColors[groupId] || groupColors[0];

  return {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 2,
    fontSize: "0.65rem",
    height: "20px",
    backgroundColor: groupColor.border,
    color: "white",
    fontWeight: 600,
    ...(extra && extra),
    "& .MuiChip-label": {
      padding: "0 4px",
    },
  };
});

const TaskCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: "#fafafa",
  border: "1px solid #e0e0e0",
  borderRadius: theme.spacing(1),
  transition: "all 0.2s",
  position: "relative",

  "&:hover": {
    backgroundColor: "#f5f5f5",
    borderColor: "#d0d0d0",
  },
}));

const TaskStatusChip = styled(Chip)(({ theme, taskstatus }) => ({
  fontSize: "0.65rem",
  height: "18px",
  backgroundColor: taskStatusColors[taskstatus]?.bg || taskStatusColors.TODO.bg,
  color: taskStatusColors[taskstatus]?.color || taskStatusColors.TODO.color,
  border: `1px solid ${
    taskStatusColors[taskstatus]?.border || taskStatusColors.TODO.border
  }`,
  "& .MuiChip-label": {
    padding: "0 4px",
  },
}));

const TasksContainer = styled(Box)(({ theme }) => ({
  maxHeight: "200px",
  overflowY: "auto",
  padding: theme.spacing(1),
  backgroundColor: "#f9f9f9",
  borderRadius: theme.spacing(1),
  border: "1px solid #e0e0e0",
}));

// Task Preview Modal Component
const TaskPreviewModal = ({ open, onClose, task, isModification = false }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent>
        {open && (
          <TaskDetails
            id={task?.id}
            type={isModification ? "MODIFICATION" : "PROJECT"}
            showBackButton={false}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

const DesignersPreviewModal = ({ lead }) => {
  const [open, setOpen] = useState(false);
  const [assignmentId, setAssignmentId] = useState(null);
  const [deleteDesigner, setDeleteDesigner] = useState(false);
  const [openDesignerModal, setOpenDesignerModal] = useState(false);

  return (
    <>
      <Button
        mb={1}
        startIcon={<MdAssignmentInd size={22} color={colors.primary} />}
        variant="outlined"
        onClick={() => setOpenDesignerModal(true)}
      >
        View assigned designers
      </Button>
      <Dialog
        open={openDesignerModal}
        onClose={() => setOpenDesignerModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <Grid2 size={12} sx={{ mt: 3 }}>
            <StyledCard sx={{ p: 0, overflow: "visible" }}>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <MdAssignmentInd size={22} color={colors.primary} />
                    <Typography variant="h6" sx={{ ml: 1.5, fontWeight: 600 }}>
                      Project Designers
                    </Typography>
                  </Box>
                }
                action={
                  <Button
                    onClick={() => {
                      setOpen(true);
                      setAssignmentId(null);
                      setDeleteDesigner(false);
                    }}
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<MdAdd />}
                  >
                    Assign New Designer
                  </Button>
                }
                sx={{ px: 3, pt: 2.5, pb: 1 }}
              />

              <Divider sx={{ mx: 3 }} />

              <CardContent sx={{ p: 3 }}>
                {lead.projects[0].assignments?.length ? (
                  lead.projects[0].assignments?.map((assignment) => (
                    <StyledDesignerCard key={assignment.id}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 40,
                            height: 40,
                          }}
                        >
                          {assignment.user.name.charAt(0)}
                        </Avatar>
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {assignment.user.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {assignment.user.email}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Remove from project">
                          <Button
                            onClick={() => {
                              setOpen(true);
                              setAssignmentId(assignment.id);
                              setDeleteDesigner(true);
                            }}
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<MdDelete />}
                          >
                            Remove
                          </Button>
                        </Tooltip>
                      </Box>
                    </StyledDesignerCard>
                  ))
                ) : (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body1" color="text.secondary">
                      No designers assigned to this project yet
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </StyledCard>
          </Grid2>
        </DialogContent>
      </Dialog>
      {open && (
        <AssignDesignerModal
          open={open}
          project={lead.projects[0]}
          setOpen={setOpen}
          onUpdate={() => {
            window.location.reload();
          }}
          assignmentId={assignmentId}
          deleteDesigner={deleteDesigner}
        />
      )}
    </>
  );
};

// Task Item Component
const TaskItem = ({ task, onPreview }) => {
  return (
    <TaskCard>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={1}
      >
        <Typography variant="body2" fontWeight="medium" sx={{ flex: 1, mr: 1 }}>
          {task.title}
        </Typography>

        <Box display="flex" gap={0.5} alignItems="center">
          <PriorityBadge
            priority={task.priority}
            label={task.priority.replace("_", " ")}
            size="small"
            task={true}
          />
          <IconButton size="small" onClick={() => onPreview(task)}>
            <MdVisibility size={14} />
          </IconButton>
        </Box>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <TaskStatusChip
          taskstatus={task.status}
          label={task.status.replace("_", " ")}
          size="small"
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.3,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Updated at:
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {dayjs(task.updatedAt).format("MMM D")}
          </Typography>
        </Box>
      </Box>

      {task.description && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            mt: 0.5,
          }}
        >
          {task.description.length > 50
            ? `${task.description.slice(0, 50)}...`
            : task.description}
        </Typography>
      )}
    </TaskCard>
  );
};

const WorkStageKanbanCard = ({
  lead,
  movelead,
  setleads,
  type,
  statusArray,
  setRerenderColumns,
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

              <Grid2 container spacing={1} sx={{ mb: 2 }}>
                <Grid2 size={shouldShowModifications ? 4 : 6}>
                  <Typography variant="caption" color="text.secondary">
                    Delivery Time
                  </Typography>
                  <Typography variant="body2">
                    {lead.projects[0].deliveryTime ? (
                      <CountdownTimer time={lead.projects[0].deliveryTime} />
                    ) : (
                      <Typography variant="body2">Not set</Typography>
                    )}
                  </Typography>
                </Grid2>
                <Grid2 size={shouldShowModifications ? 4 : 6}>
                  <Typography variant="caption" color="text.secondary">
                    Tasks
                  </Typography>
                  <Typography variant="body2">
                    {totalTasks} task{totalTasks !== 1 ? "s" : ""}
                  </Typography>
                </Grid2>
                {shouldShowModifications && (
                  <Grid2 size={4}>
                    <Typography variant="caption" color="text.secondary">
                      Modifications
                    </Typography>
                    <Typography variant="body2">
                      {totalModifications} mod
                      {totalModifications !== 1 ? "s" : ""}
                    </Typography>
                  </Grid2>
                )}
              </Grid2>

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
