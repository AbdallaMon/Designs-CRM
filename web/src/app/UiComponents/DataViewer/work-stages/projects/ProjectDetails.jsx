"use client";
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
} from "react-icons/md";
import { PROJECT_STATUSES, statusColors } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import dayjs from "dayjs";
import colors from "@/app/helpers/colors";
import { RelatedLinks } from "../../utility/RelatedLinks";
import { AiOutlineSwap } from "react-icons/ai";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  checkIfADesigner,
  checkIfAdmin,
} from "@/app/helpers/functions/utility";
import { AssignDesignerModal } from "./AssignDesignerModal";
import { ProjectTasksDialog, TasksDialog } from "../utility/ProjectTasksDialog";
import DeliverySchedulesPanel from "../utility/ProjectDeilverySchedule";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { StatusPill, MetaItem } from "../../leads/shared/tabKit";
import { EmptyState } from "../../leads/shared/EmptyState";

// Resolve a semantic color for a project status. Falls back to primary so any
// future status still renders consistently. Uses the shared statusColors map.
const getStatusColor = (status) => statusColors[status] || colors.primary;

// Display-only Arabic labels for the project statuses. Keys remain the English
// enum values used everywhere in logic/comparisons; only the shown text changes.
const STATUS_LABELS_AR = {
  "To Do": "قيد الانتظار",
  "3D": "تصميم 3D",
  Render: "إخراج (Render)",
  Modification: "تعديلات",
  Delivery: "تسليم",
  Hold: "معلّق",
  Completed: "مكتمل",
  Rejected: "مرفوض",
  Studying: "دراسة",
  Electricity: "كهرباء",
  Started: "بدأ",
  "In Progress": "قيد التنفيذ",
};
const labelForStatus = (status) => STATUS_LABELS_AR[status] || status;

const PRIORITY_LABELS_AR = {
  VERY_LOW: "منخفضة جدًا",
  LOW: "منخفضة",
  MEDIUM: "متوسطة",
  HIGH: "مرتفعة",
  VERY_HIGH: "مرتفعة جدًا",
};

// Styled components
export const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
  transition: "box-shadow 0.2s ease, border-color 0.2s ease",
  overflow: "visible",
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 10,
  textTransform: "none",
  fontWeight: 600,
  boxShadow: "none",
  transition: "all 0.2s ease",
  "&:hover": {
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
  },
}));

const InfoCard = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: 14,
  border: `1px solid ${theme.palette.divider}`,
  transition: "box-shadow 0.2s ease, border-color 0.2s ease",
  "&:hover": {
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.06)",
    borderColor: alpha(theme.palette.primary.main, 0.4),
  },
  minWidth: 160,
}));

const PriorityChip = styled(Chip)(({ theme, priority }) => ({
  borderRadius: 12,
  height: 32,
  fontWeight: 600,
  marginLeft: theme.spacing(1),
}));

const StyledProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 6,
  backgroundColor: theme.palette.grey[200],
  "& .MuiLinearProgress-bar": {
    borderRadius: 6,
  },
}));

const ProgressDot = styled(Box)(({ theme, active }) => ({
  width: 14,
  height: 14,
  borderRadius: "50%",
  backgroundColor: active
    ? theme.palette.primary.main
    : theme.palette.grey[300],
  transition: "all 0.3s ease",
  transform: active ? "scale(1.1)" : "scale(1)",
  boxShadow: active
    ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}`
    : "none",
}));

export const StyledDesignerCard = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1.25),
  padding: theme.spacing(1.75),
  backgroundColor: theme.palette.background.paper,
  borderRadius: 14,
  border: `1px solid ${theme.palette.divider}`,
  width: "100%",
  transition: "all 0.2s ease",
  "&:hover": {
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.06)",
    borderColor: alpha(theme.palette.primary.main, 0.4),
  },
}));

// Project Progress Tracker Component
const ProjectProgressTracker = ({ project }) => {
  const theme = useTheme();
  // Filter out Hold and get only completion statuses
  const getCompletionStatuses = (projectType) => {
    return PROJECT_STATUSES[projectType].filter(
      (status) => status !== "Hold" && status !== "Rejected"
    );
  };

  const completionStatuses = getCompletionStatuses(project.type);
  const currentStatusIndex = completionStatuses.indexOf(project.status);

  // Calculate percentage completion
  const calculatePercentage = () => {
    if (currentStatusIndex === -1) return 0;
    if (completionStatuses.length <= 1) return 100;
    return Math.round(
      (currentStatusIndex / (completionStatuses.length - 1)) * 100
    );
  };

  // Calculate project duration
  const calculateProjectDuration = (startDate, endDate) => {
    if (!startDate) {
      return { text: "لم يبدأ بعد", color: "text.secondary" };
    }

    if (!endDate) {
      const start = dayjs(startDate);
      const now = dayjs();
      const days = now.diff(start, "day");

      return {
        text: `قيد التنفيذ (${days} يومًا حتى الآن)`,
        color: "info.main",
      };
    }

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const days = end.diff(start, "day");
    const months = end.diff(start, "month");

    if (days < 0) {
      return { text: "تواريخ غير صالحة", color: "error.main" };
    }

    if (days > 30) {
      return {
        text: `اكتمل خلال ${months} ${
          months === 1 ? "شهر" : "أشهر"
        } (${days} يومًا)`,
        color: "success.main",
      };
    }

    return {
      text: `اكتمل خلال ${days} يومًا`,
      color: "success.main",
    };
  };

  const percentageComplete = calculatePercentage();
  const isOnHold = project.status === "Hold";
  const isRejected = project.status === "Rejected";
  const duration = calculateProjectDuration(project.startedAt, project.endedAt);

  return (
    <StyledCard
      elevation={0}
      sx={{
        mb: 3,
        overflow: "visible",
        "&.MuiPaper-root": {
          height: "fit-content",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Status Message for Hold or Rejected */}
        {isOnHold || isRejected ? (
          <Box
            sx={{
              p: 2.25,
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              bgcolor: alpha(
                isOnHold ? theme.palette.warning.main : theme.palette.error.main,
                0.1
              ),
              border: `1px solid ${alpha(
                isOnHold ? theme.palette.warning.main : theme.palette.error.main,
                0.3
              )}`,
              color: isOnHold
                ? theme.palette.warning.dark
                : theme.palette.error.dark,
            }}
          >
            {isOnHold ? <MdPause size={22} /> : <MdError size={22} />}
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {isOnHold
                ? "هذا المشروع معلّق حاليًا. سيُستأنف التقدم عند رفع التعليق."
                : "تم رفض هذا المشروع ويتطلب المراجعة قبل المتابعة."}
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* Combined Progress and Duration */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1.5,
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                تقدّم المشروع
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
              >
                <Tooltip title="نسبة الإنجاز">
                  <Chip
                    label={`${percentageComplete}%`}
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 700, borderRadius: 1.5 }}
                  />
                </Tooltip>
                <Typography
                  variant="body2"
                  color={duration.color}
                  sx={{ fontWeight: 600 }}
                >
                  {duration.text}
                </Typography>
              </Box>
            </Box>

            {/* Progress bar */}
            <StyledProgressBar
              variant="determinate"
              value={percentageComplete}
              sx={{ mb: 3 }}
            />

            {/* Enhanced stepper with dots */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                px: 0.5,
                mt: 1.5,
              }}
            >
              {completionStatuses.map((label, index) => (
                <Box key={label} sx={{ textAlign: "center", flex: 1 }}>
                  <Tooltip title={labelForStatus(label)}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <ProgressDot active={index <= currentStatusIndex} />
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.7rem",
                          mt: 0.7,
                          fontWeight: index <= currentStatusIndex ? 700 : 500,
                          color:
                            index <= currentStatusIndex
                              ? "primary.main"
                              : "text.secondary",
                        }}
                      >
                        {labelForStatus(label)}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );
};

export const ProjectDetails = ({
  project,
  onUpdate,
  isStaff,
  withReleventLinks,
  renderTasks = true,
}) => {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState({ ...project });
  const [open, setOpen] = useState(false);
  const [assignmentId, setAssignmentId] = useState(null);
  const [deleteDesigner, setDeleteDesigner] = useState(false);
  const { setLoading } = useToastContext();
  const { user } = useAuth();
  const cantDoActions = user.role === "STAFF";
  const { setAlertError } = useAlertContext();
  const isAdmin = checkIfAdmin(user);
  const isDesigner = checkIfADesigner(user);
  //if designer he can edit area only
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = async (value) => {
    if (cantDoActions) {
      setAlertError("You do not have permission to perform this action.");
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
      `shared/designers/${project.clientLeadId}/status`,
      false,
      "Updating",
      null,
      "PUT"
    );
    if (request.status === 200) {
      window.location.reload();
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
    if (cantDoActions) {
      setAlertError("You do not have permission to perform this action.");
      return;
    }
    e.preventDefault();

    const updatedProject = await handleRequestSubmit(
      editedProject,
      setLoading,
      `shared/projects/${project.id}`,
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
        title="تعديل تفاصيل المشروع"
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
                <InputLabel id="status-label">حالة المشروع</InputLabel>
                <Select
                  labelId="status-label"
                  value={editedProject.status}
                  label="حالة المشروع"
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

            {!isDesigner && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="priority-label">مستوى الأولوية</InputLabel>
                  <Select
                    labelId="priority-label"
                    value={editedProject.priority}
                    label="مستوى الأولوية"
                    onChange={(e) =>
                      handleInputChange("priority", e.target.value)
                    }
                  >
                    <MenuItem value="VERY_LOW">منخفضة جدًا</MenuItem>
                    <MenuItem value="LOW">منخفضة</MenuItem>
                    <MenuItem value="MEDIUM">متوسطة</MenuItem>
                    <MenuItem value="HIGH">مرتفعة</MenuItem>
                    <MenuItem value="VERY_HIGH">مرتفعة جدًا</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="المساحة (م²)"
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
                  إلغاء
                </StyledButton>
                <StyledButton
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<MdSave />}
                  size="large"
                >
                  حفظ التغييرات
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
                      مساحة المشروع
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {project.area ? `${project.area} م²` : "غير محددة"}
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
                      الجدول الزمني للمشروع
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {project.startedAt
                        ? dayjs(project.startedAt).format("DD MMM, YY")
                        : "لم يبدأ"}
                      {project.endedAt
                        ? ` - ${dayjs(project.endedAt).format("DD MMM, YY")}`
                        : project.startedAt
                        ? " - مستمر"
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

        {!isStaff && !cantDoActions && (
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
                      مصممو المشروع
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
                    إسناد مصمم جديد
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
                        <Tooltip title="إزالة من المشروع">
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
                            إزالة
                          </StyledButton>
                        </Tooltip>
                      </Box>
                    </StyledDesignerCard>
                  ))
                ) : (
                  <EmptyState
                    icon={<MdAssignmentInd />}
                    title="لا يوجد مصممون مُسندون"
                    description="لم يتم إسناد أي مصمم إلى هذا المشروع بعد."
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
                  label={`المجموعة: ${project.groupTitle}`}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    height: 34,
                  }}
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
              </Box>

              {((!isStaff && !cantDoActions) || isDesigner) && (
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
                    تعديل التفاصيل
                  </StyledButton>
                  {!isDesigner && (
                    <StyledButton
                      variant="contained"
                      color="primary"
                      startIcon={<MdOpenInNew />}
                      component="a"
                      href={`/dashboard/projects/grouped/${project.clientLeadId}`}
                    >
                      عرض كل مشاريع العميل
                    </StyledButton>
                  )}
                </Box>
              )}
            </Box>

            {renderProjectInfo()}
          </CardContent>
        </StyledCard>
      )}

      {renderTasks && !cantDoActions && (
        <ProjectTasksDialog project={project} />
      )}
    </>
  );
};
