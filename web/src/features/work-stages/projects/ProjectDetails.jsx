"use client";
import { PROFILES, USER_FEEDBACK_MESSAGES as FEEDBACK } from "@dms/shared";
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  DialogActions,
  DialogContent,
  DialogTitle,
  Dialog,
  CircularProgress,
  styled,
  LinearProgress,
  Collapse,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  AppBar,
  Toolbar,
  Container,
  Menu,
  Avatar,
  Badge,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";

import {
  MdAdd,
  MdCancel,
  MdEdit,
  MdSave,
  MdVisibility,
  MdVisibilityOff,
  MdPause,
  MdError,
  MdOutlineCalendarToday,
  MdOutlineSquareFoot,
  MdPerson,
  MdOutlineAccessTime,
  MdCheck,
  MdClose,
  MdList,
  MdCalendarMonth,
  MdPriorityHigh,
  MdSwapHoriz,
  MdAssignment,
  MdDelete,
  MdAssignmentInd,
  MdGroup,
  MdOpenInNew,
  MdArchitecture,
} from "react-icons/md";
import { PROJECT_STATUSES, statusColors } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import dayjs from "dayjs";
import colors from "@/app/helpers/colors";
import { RelatedLinks } from "@/shared/components/common/RelatedLinks.jsx";
import { AgingBadge } from "@/features/Kanban/work-stages/WorkStageCardSignals.jsx";
import { AiOutlineSwap } from "react-icons/ai";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  checkIfADesigner,
  checkIfAdmin,
} from "@/app/helpers/functions/utility";
import { AssignDesignerModal } from "@/features/work-stages/projects/AssignDesignerModal.jsx";
import { ProjectTasksDialog, TasksDialog } from "@/features/work-stages/utility/ProjectTasksDialog.jsx";
import DeliverySchedulesPanel from "@/features/work-stages/utility/ProjectDeliverySchedule.jsx";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { StatusPill, MetaItem } from "@/features/leads/shared/tabKit.jsx";
import { EmptyState } from "@/features/leads/shared/EmptyState.jsx";
import {
  StyledCard,
  StyledButton,
  InfoCard,
  PriorityChip,
  StyledDesignerCard,
} from "@/features/work-stages/projects/projectDetailsStyles.js";
import {
  ProjectProgressTracker,
  labelForStatus,
} from "@/features/work-stages/projects/ProjectProgressTracker.jsx";
import { getProjectTypeLabel } from "@/features/work-stages/projects/projectTypePresentation.js";

// Re-exported so existing external importers keep resolving these from here.
export { StyledCard, StyledDesignerCard };

// Resolve a semantic color for a project status. Falls back to primary so any
// future status still renders consistently. Uses the shared statusColors map.
const getStatusColor = (status) => statusColors[status] || colors.primary;

const PRIORITY_LABELS_AR = {
  VERY_LOW: "Very Low",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  VERY_HIGH: "Very High",
};

export const ProjectDetails = ({
  project,
  onUpdate,
  isStaff,
  withReleventLinks,
  renderTasks = true,
  showOpenPage = true,
}) => {
  const theme = useTheme();
  const projectTypeLabel = getProjectTypeLabel(project.type);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState({ ...project });
  const [open, setOpen] = useState(false);
  const [assignmentId, setAssignmentId] = useState(null);
  const [deleteDesigner, setDeleteDesigner] = useState(false);
  const { setLoading } = useToastContext();
  const { user } = useAuth();
  const cantDoActions = [PROFILES.NORMAL_SALES, PROFILES.PRIMARY_SALES, PROFILES.SUPER_SALES].includes(user.profile);
  const { setAlertError } = useAlertContext();
  const isAdmin = checkIfAdmin(user);
  const isDesigner = checkIfADesigner(user);
  //if designer he can edit area only

  // Capability-with-fallback gates (profiles sweep). Prefer the backend-computed
  // `project.capabilities.*` when the record carries them (the designer/project detail,
  // the clientLead board list and getById now attach them); fall back to the legacy role
  // expression for reuse contexts where the record is undecorated (e.g. the designer
  // dashboard `user-profile` list), so those paths keep their exact current behavior.
  // Board status change (POST .../actions/change-status) was STAFF-blocked → canChangeStatus.
  const canChangeStatus = project?.capabilities
    ? Boolean(project.capabilities.canChangeStatus)
    : !cantDoActions;
  // Plain field-edit submit (PUT /projects/:id) was STAFF-blocked → canEdit.
  const canEditFields = project?.capabilities
    ? Boolean(project.capabilities.canEdit)
    : !cantDoActions;
  // The edit-affordance row (edit button; also shown for designers) → canEdit.
  const canShowEditActions = project?.capabilities
    ? Boolean(project.capabilities.canEdit)
    : (!isStaff && !cantDoActions) || isDesigner;
  // Admin-management "designers" card (assign/remove designer) is `project.manage`.
  const canManageDesigners = project?.capabilities
    ? Boolean(project.capabilities.canAssignDesigner)
    : !isStaff && !cantDoActions;
  // Project tasks dialog affordance was STAFF-blocked → canAddTask.
  const canAddTask = project?.capabilities
    ? Boolean(project.capabilities.canAddTask)
    : !cantDoActions;

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = async (value) => {
    if (!canChangeStatus) {
      setAlertError(FEEDBACK.PERMISSION_DENIED);
      return;
    }
    const request = await handleRequestSubmit(
      {
        status: value,
        oldStatus: project.status,
        isAdmin: isAdmin,
        id: project.id,
      },
      setLoading,
      `projects/designers/${project.clientLeadId}/actions/change-status`,
      false,
      "Updating",
      null,
      "POST"
    );
    if (request.status === 200) {
      // Live, in-place update: reflect the new status on the project the parent holds
      // instead of a full page reload. Construct the updated project locally so we don't
      // depend on the change-status endpoint's response shape.
      if (onUpdate) {
        onUpdate({ ...project, status: value });
      } else {
        window.location.reload();
      }
      setAnchorEl(null);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedProject({
      ...editedProject,
      [field]: value,
    });
  };

  const handleSubmit = async (e) => {
    if (!canEditFields) {
      setAlertError(FEEDBACK.PERMISSION_DENIED);
      return;
    }
    e.preventDefault();

    const updatedProject = await handleRequestSubmit(
      editedProject,
      setLoading,
      `projects/${project.id}`,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (updatedProject.status === 200) {
      onUpdate(updatedProject.data);
      setIsEditing(false);
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "VERY_HIGH":
      case "HIGH":
        return "error";
      case "MEDIUM":
        return "warning";
      case "LOW":
      case "VERY_LOW":
        return "success";
      default:
        return "primary";
    }
  };

  // Format priority label
  const formatPriority = (priority) => {
    return (
      PRIORITY_LABELS_AR[priority] ||
      priority
        .replace("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  const renderEditForm = () => (
    <StyledCard sx={{ p: 1, mt: 3 }}>
      <CardHeader
        title="Edit Project Details"
        titleTypographyProps={{
          variant: "h6",
          fontWeight: 700,
          color: "primary.main",
        }}
      />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="status-label">Project Status</InputLabel>
                <Select
                  labelId="status-label"
                  value={editedProject.status}
                  label="Project Status"
                  onChange={(e) => handleInputChange("status", e.target.value)}
                >
                  {PROJECT_STATUSES[project.type].map((status) => (
                    <MenuItem key={status} value={status}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {status === "Hold" && (
                          <MdPause size={18} style={{ marginInlineEnd: 8 }} />
                        )}
                        {status === "Rejected" && (
                          <MdClose size={18} style={{ marginInlineEnd: 8 }} />
                        )}
                        {status === "Completed" && (
                          <MdCheck size={18} style={{ marginInlineEnd: 8 }} />
                        )}
                        {labelForStatus(status)}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* TODO(profiles): no capability for area-only edit; left as role check
                (designers may edit area but not priority). */}
            {!isDesigner && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="priority-label">Priority Level</InputLabel>
                  <Select
                    labelId="priority-label"
                    value={editedProject.priority}
                    label="Priority Level"
                    onChange={(e) =>
                      handleInputChange("priority", e.target.value)
                    }
                  >
                    <MenuItem value="VERY_LOW">Very Low</MenuItem>
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="VERY_HIGH">Very High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Area (m²)"
                type="number"
                variant="outlined"
                inputProps={{ step: 0.01 }}
                value={editedProject.area || ""}
                onChange={(e) =>
                  handleInputChange(
                    "area",
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
              />
            </Grid>

            <Grid size={12}>
              <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                <StyledButton
                  variant="outlined"
                  color="secondary"
                  startIcon={<MdCancel />}
                  onClick={() => setIsEditing(false)}
                  size="large"
                >
                  Cancel
                </StyledButton>
                <StyledButton
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<MdSave />}
                  size="large"
                >
                  Save Changes
                </StyledButton>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </StyledCard>
  );

  const renderProjectInfo = () => (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Grid
            container
            spacing={2.5}
            sx={{
              width: "100%",
            }}
          >
            <Grid size={{ xs: 12, lg: 3 }}>
              <Stack spacing={2}>
                <InfoCard>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: "primary.main",
                      p: 1.25,
                      borderRadius: 2.5,
                      mr: 2,
                      flexShrink: 0,
                    }}
                  >
                    <MdOutlineSquareFoot size={22} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Project Area
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {project.area ? `${project.area} m²` : "Not specified"}
                    </Typography>
                  </Box>
                </InfoCard>

                <InfoCard>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: "primary.main",
                      p: 1.25,
                      borderRadius: 2.5,
                      mr: 2,
                      flexShrink: 0,
                    }}
                  >
                    <MdOutlineAccessTime size={22} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Project Timeline
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {project.startedAt
                        ? dayjs(project.startedAt).format("DD MMM, YY")
                        : "Not started"}
                      {project.endedAt
                        ? ` - ${dayjs(project.endedAt).format("DD MMM, YY")}`
                        : project.startedAt
                        ? " - Ongoing"
                        : ""}
                    </Typography>
                  </Box>
                </InfoCard>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, lg: 9 }}>
              <Box
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 3.5,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: "background.paper",
                  height: "100%",
                }}
              >
                <DeliverySchedulesPanel
                  projectId={project.id}
                  clientLeadId={project.clientLeadId}
                />
              </Box>
            </Grid>
          </Grid>
        </Grid>

        {canManageDesigners && (
          <Grid size={12}>
            <StyledCard sx={{ p: 0, overflow: "visible" }}>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: "primary.main",
                      }}
                    >
                      <MdAssignmentInd size={20} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Project Designers
                    </Typography>
                  </Box>
                }
                action={
                  <StyledButton
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
                  </StyledButton>
                }
                sx={{ px: 3, pt: 2.5, pb: 1 }}
              />

              <Divider sx={{ mx: 3 }} />

              <CardContent sx={{ p: 3 }}>
                {project.assignments?.length ? (
                  project.assignments?.map((assignment) => (
                    <StyledDesignerCard key={assignment.id}>
                      <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 40,
                            height: 40,
                            fontWeight: 700,
                          }}
                        >
                          {assignment.user.name.charAt(0)}
                        </Avatar>
                        <Box sx={{ ml: 2, minWidth: 0 }}>
                          <Typography variant="subtitle1" fontWeight={600} noWrap>
                            {assignment.user.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {assignment.user.email}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                        <Tooltip title="Remove from project">
                          <StyledButton
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
                          </StyledButton>
                        </Tooltip>
                      </Box>
                    </StyledDesignerCard>
                  ))
                ) : (
                  <EmptyState
                    icon={<MdAssignmentInd />}
                    title="No designers assigned"
                    description="No designers have been assigned to this project yet."
                  />
                )}
              </CardContent>
            </StyledCard>
          </Grid>
        )}
      </Grid>
      {withReleventLinks && (
        <Box sx={{ mt: 3 }}>
          <RelatedLinks clientLeadId={project.clientLeadId} />
        </Box>
      )}
      {open && (
        <AssignDesignerModal
          open={open}
          project={project}
          setOpen={setOpen}
          onUpdate={onUpdate}
          assignmentId={assignmentId}
          deleteDesigner={deleteDesigner}
        />
      )}
    </Box>
  );

  return (
    <>
      <Paper
        component="header"
        variant="outlined"
        sx={{
          mb: 2,
          p: { xs: 2, sm: 2.5 },
          borderRadius: 3,
          borderColor: alpha(theme.palette.primary.main, 0.22),
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.08
          )}, ${alpha(theme.palette.background.paper, 0.98)})`,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: alpha(theme.palette.primary.main, 0.14),
            color: "primary.main",
          }}
        >
          <MdArchitecture size={25} aria-hidden="true" />
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 700, lineHeight: 1.2, letterSpacing: "0.08em" }}
          >
            Project type
          </Typography>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
            {projectTypeLabel}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Project #{project.id}
            {project.groupTitle ? ` · ${project.groupTitle}` : ""}
          </Typography>
        </Box>
      </Paper>

      <ProjectProgressTracker project={project} />

      {isEditing ? (
        renderEditForm()
      ) : (
        <StyledCard sx={{ mb: 3, overflow: "visible" }}>
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flexWrap: "wrap",
                }}
              >
                <Chip
                  icon={<MdGroup />}
                  label={`Group: ${project.groupTitle}`}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    height: 34,
                  }}
                />
                <Chip
                  icon={<MdArchitecture />}
                  label={`Type: ${projectTypeLabel}`}
                  color="primary"
                  variant="outlined"
                  sx={{ borderRadius: 2, fontWeight: 700, height: 34 }}
                />
                <StyledButton
                  variant="contained"
                  startIcon={!isAdmin && <AiOutlineSwap />}
                  aria-controls={menuOpen ? "status-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={menuOpen ? "true" : undefined}
                  onClick={handleClick}
                  sx={{
                    bgcolor: getStatusColor(project.status),
                    color: "#fff",
                    fontWeight: 700,
                    borderRadius: 2.5,
                    px: 2,
                    "&:hover": {
                      bgcolor: getStatusColor(project.status),
                      filter: "brightness(0.94)",
                    },
                  }}
                >
                  {labelForStatus(project.status)}
                </StyledButton>
                <Menu
                  id="status-menu"
                  anchorEl={anchorEl}
                  key={project.id}
                  open={menuOpen}
                  onClose={() => setAnchorEl(null)}
                  PaperProps={{
                    sx: {
                      borderRadius: 2.5,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      mt: 1,
                    },
                  }}
                >
                  {PROJECT_STATUSES[project.type].map((status) => (
                    <MenuItem
                      key={status}
                      value={status}
                      onClick={() => handleMenuClose(status)}
                      sx={{
                        px: 2,
                        py: 1.2,
                        "&:hover": {
                          backgroundColor: "action.hover",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {status === "Hold" && (
                          <MdPause size={18} style={{ marginInlineEnd: 8 }} />
                        )}
                        {status === "Rejected" && (
                          <MdClose size={18} style={{ marginInlineEnd: 8 }} />
                        )}
                        {status === "Completed" && (
                          <MdCheck size={18} style={{ marginInlineEnd: 8 }} />
                        )}
                        {labelForStatus(status)}
                      </Box>
                    </MenuItem>
                  ))}
                </Menu>
                <PriorityChip
                  icon={<MdPriorityHigh />}
                  label={formatPriority(project.priority)}
                  color={getPriorityColor(project.priority)}
                  priority={project.priority}
                />
                <AgingBadge status={project.status} cardMeta={project.cardMeta} />
              </Box>

              {canShowEditActions && (
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  <StyledButton
                    variant="outlined"
                    color="primary"
                    startIcon={<MdEdit />}
                    onClick={() => {
                      setIsEditing(true);
                      setEditedProject({ ...project });
                    }}
                  >
                    Edit Details
                  </StyledButton>
                  {showOpenPage && (
                    <StyledButton
                      variant="outlined"
                      color="primary"
                      startIcon={<MdOpenInNew />}
                      component="a"
                      href={`/dashboard/projects/${project.id}`}
                    >
                      Open Project Page
                    </StyledButton>
                  )}
                  {/* TODO(profiles): no capability for "view all client projects";
                      it's an admin-tier display nuance, left as role check. */}
                  {!isDesigner && (
                    <StyledButton
                      variant="contained"
                      color="primary"
                      startIcon={<MdOpenInNew />}
                      component="a"
                      href={`/dashboard/projects/grouped/${project.clientLeadId}`}
                    >
                      View All Lead Projects
                    </StyledButton>
                  )}
                </Box>
              )}
            </Box>

            {renderProjectInfo()}
          </CardContent>
        </StyledCard>
      )}

      {renderTasks && canAddTask && (
        <ProjectTasksDialog project={project} />
      )}
    </>
  );
};
