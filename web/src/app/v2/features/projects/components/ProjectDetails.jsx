"use client";

// Project work-surface — migrated from the legacy ProjectDetails.jsx (UiComponents/.../
// work-stages/projects/ProjectDetails.jsx). Preserves the appearance/behavior: a progress
// tracker, a status-change menu, a field-edit form (status/priority/area), a designers
// panel with assign/remove, and the delivery-schedules + tasks panels. Collapses the
// per-role rendering (isStaff / cantDoActions / isDesigner branches) into ONE
// capability-gated path: actions appear iff the backend-computed capabilities.* allow
// (combined with the matching permission code). §5c deltas:
//   • status change → POST /v2/projects/designers/:clientLeadId/actions/change-status
//     with body { id: project.id, status } (server derives oldStatus).
//   • field edit    → PUT /v2/projects/:id with ONLY the whitelisted fields.
//   • assign        → POST /v2/projects/:id/actions/assign-designer.

import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import {
  MdAdd,
  MdAssignmentInd,
  MdCancel,
  MdCheck,
  MdClose,
  MdDelete,
  MdEdit,
  MdError,
  MdGroup,
  MdPause,
  MdPriorityHigh,
  MdSave,
} from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import {
  PROJECT_STATUSES,
  statusColors,
  formatPriority,
} from "../config/projectsConstants.js";
import { projectsService, pickProjectFields } from "../projects.service.js";
import { runProjectMutation } from "../projects.mutations.js";
import { AssignDesignerModal } from "./AssignDesignerModal.jsx";
import DeliverySchedulesPanel from "./DeliverySchedulesPanel.jsx";
import { ProjectTasksPanel } from "./ProjectTasksPanel.jsx";

function getPriorityColor(priority) {
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
}

function ProjectProgressTracker({ project }) {
  const statuses = PROJECT_STATUSES[project.type] || [];
  const completionStatuses = statuses.filter((s) => s !== "Hold" && s !== "Rejected");
  const currentStatusIndex = completionStatuses.indexOf(project.status);
  const percentageComplete =
    currentStatusIndex === -1
      ? 0
      : completionStatuses.length <= 1
        ? 100
        : Math.round((currentStatusIndex / (completionStatuses.length - 1)) * 100);
  const isOnHold = project.status === "Hold";
  const isRejected = project.status === "Rejected";

  return (
    <Card sx={{ mb: 3, borderRadius: 3 }} elevation={2}>
      <CardContent sx={{ p: 3 }}>
        {isOnHold || isRejected ? (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: isOnHold ? "warning.light" : "error.light",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
            }}
          >
            {isOnHold ? <MdPause size={22} /> : <MdError size={22} />}
            <Typography variant="body1" sx={{ ml: 1.5, fontWeight: 500 }}>
              {isOnHold ? "هذا المشروع معلّق حالياً." : "تم رفض هذا المشروع."}
            </Typography>
          </Paper>
        ) : (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, alignItems: "center" }}>
              <Typography variant="h6" fontWeight="medium">
                تقدّم المشروع
              </Typography>
              <Chip label={`${percentageComplete}%`} color="primary" size="small" sx={{ fontWeight: "bold" }} />
            </Box>
            <LinearProgress
              variant="determinate"
              value={percentageComplete}
              sx={{ mb: 2.5, height: 10, borderRadius: 5 }}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between", px: 0.5 }}>
              {completionStatuses.map((label, index) => (
                <Box key={label} sx={{ textAlign: "center", flex: 1 }}>
                  <Tooltip title={label}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.7rem",
                        fontWeight: index <= currentStatusIndex ? 600 : 400,
                        color: index <= currentStatusIndex ? "primary.main" : "text.secondary",
                      }}
                    >
                      {label}
                    </Typography>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export function ProjectDetails({ project, onUpdate, renderTasks = true }) {
  const { hasPermission } = usePermission();
  const caps = project?.capabilities ?? {};

  const canEdit = hasPermission(PERMISSIONS.PROJECT.EDIT) && caps.canEdit;
  const canEditStatus = hasPermission(PERMISSIONS.PROJECT.EDIT) && caps.canEditStatus;
  const canChangeStatus = hasPermission(PERMISSIONS.PROJECT.MANAGE) && caps.canChangeStatus;
  const canAssignDesigner = hasPermission(PERMISSIONS.PROJECT.MANAGE) && caps.canAssignDesigner;

  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState({ ...project });
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignmentId, setAssignmentId] = useState(null);
  const [deleteDesigner, setDeleteDesigner] = useState(false);

  // POST /designers/:clientLeadId/actions/change-status — { id, status }; server derives
  // oldStatus. The board-status menu is gated on canChangeStatus (PROJECT.MANAGE).
  const handleStatusSelect = async (value) => {
    const res = await runProjectMutation(
      () => projectsService.changeStatus(project.clientLeadId, { id: project.id, status: value }),
      { loading: "جاري تحديث الحالة..." },
    );
    setAnchorEl(null);
    if (res) onUpdate?.({ ...project, status: value });
  };

  // PUT /:id — plain field edit. §5c: send ONLY whitelisted fields (pickProjectFields).
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const body = pickProjectFields(editedProject);
    const res = await runProjectMutation(() => projectsService.updateProject(project.id, body), {
      loading: "جاري الحفظ...",
    });
    if (res) {
      onUpdate?.(res.data ?? { ...project, ...body });
      setIsEditing(false);
    }
  };

  const renderEditForm = () => (
    <Card sx={{ p: 2, mt: 3, borderRadius: 3 }}>
      <CardHeader title="تعديل تفاصيل المشروع" />
      <CardContent>
        <form onSubmit={handleSaveEdit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="status-label">حالة المشروع</InputLabel>
                <Select
                  labelId="status-label"
                  value={editedProject.status || ""}
                  label="حالة المشروع"
                  onChange={(e) => setEditedProject((p) => ({ ...p, status: e.target.value }))}
                >
                  {(PROJECT_STATUSES[project.type] || []).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="priority-label">الأولوية</InputLabel>
                <Select
                  labelId="priority-label"
                  value={editedProject.priority || ""}
                  label="الأولوية"
                  onChange={(e) => setEditedProject((p) => ({ ...p, priority: e.target.value }))}
                >
                  <MenuItem value="VERY_LOW">منخفضة جداً</MenuItem>
                  <MenuItem value="LOW">منخفضة</MenuItem>
                  <MenuItem value="MEDIUM">متوسطة</MenuItem>
                  <MenuItem value="HIGH">عالية</MenuItem>
                  <MenuItem value="VERY_HIGH">عالية جداً</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="المساحة (م²)"
                type="number"
                value={editedProject.area || ""}
                onChange={(e) =>
                  setEditedProject((p) => ({
                    ...p,
                    area: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                slotProps={{ htmlInput: { step: 0.01 } }}
              />
            </Grid>
            <Grid size={12}>
              <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                <Button variant="outlined" color="secondary" startIcon={<MdCancel />} onClick={() => setIsEditing(false)}>
                  إلغاء
                </Button>
                <Button type="submit" variant="contained" color="primary" startIcon={<MdSave />}>
                  حفظ التغييرات
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <>
      <ProjectProgressTracker project={project} />

      {isEditing ? (
        renderEditForm()
      ) : (
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Chip icon={<MdGroup />} label={`المجموعة: ${project.groupTitle || "-"}`} />
                <Button
                  variant="contained"
                  onClick={(e) => canChangeStatus && setAnchorEl(e.currentTarget)}
                  disabled={!canChangeStatus}
                  sx={{
                    background: statusColors[project.status],
                    fontWeight: 600,
                    borderRadius: 3,
                    px: 2,
                  }}
                  color={
                    project.status === "Completed"
                      ? "success"
                      : project.status === "Hold"
                        ? "warning"
                        : project.status === "Rejected"
                          ? "error"
                          : "primary"
                  }
                >
                  {project.status}
                </Button>
                <Menu id="status-menu" anchorEl={anchorEl} open={menuOpen} onClose={() => setAnchorEl(null)}>
                  {(PROJECT_STATUSES[project.type] || []).map((status) => (
                    <MenuItem key={status} value={status} onClick={() => handleStatusSelect(status)}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {status === "Hold" && <MdPause size={18} style={{ marginInlineEnd: 8 }} />}
                        {status === "Rejected" && <MdClose size={18} style={{ marginInlineEnd: 8 }} />}
                        {status === "Completed" && <MdCheck size={18} style={{ marginInlineEnd: 8 }} />}
                        {status}
                      </Box>
                    </MenuItem>
                  ))}
                </Menu>
                <Chip
                  icon={<MdPriorityHigh />}
                  label={formatPriority(project.priority)}
                  color={getPriorityColor(project.priority)}
                />
              </Box>

              {canEdit && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<MdEdit />}
                  onClick={() => {
                    setIsEditing(true);
                    setEditedProject({ ...project });
                  }}
                >
                  تعديل التفاصيل
                </Button>
              )}
            </Box>

            {/* project info: area / timeline + delivery schedules */}
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      مساحة المشروع
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="600">
                      {project.area ? `${project.area} م²` : "غير محددة"}
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      المدة الزمنية
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="600">
                      {project.startedAt ? dayjs(project.startedAt).format("DD MMM, YY") : "لم يبدأ"}
                      {project.endedAt
                        ? ` - ${dayjs(project.endedAt).format("DD MMM, YY")}`
                        : project.startedAt
                          ? " - جارٍ"
                          : ""}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 9 }}>
                  <DeliverySchedulesPanel project={project} />
                </Grid>
              </Grid>
            </Box>

            {/* designers panel */}
            <Box sx={{ mt: 3 }}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <MdAssignmentInd size={22} />
                      <Typography variant="h6" sx={{ ml: 1.5, fontWeight: 600 }}>
                        مصممو المشروع
                      </Typography>
                    </Box>
                  }
                  action={
                    canAssignDesigner && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<MdAdd />}
                        onClick={() => {
                          setAssignmentId(null);
                          setDeleteDesigner(false);
                          setAssignOpen(true);
                        }}
                      >
                        تعيين مصمم جديد
                      </Button>
                    )
                  }
                />
                <Divider />
                <CardContent>
                  {project.assignments?.length ? (
                    project.assignments.map((assignment) => (
                      <Box
                        key={assignment.id}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                          p: 2,
                          borderRadius: 2,
                          bgcolor: "background.paper",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
                            {assignment.user?.name?.charAt(0)}
                          </Avatar>
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {assignment.user?.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {assignment.user?.email}
                            </Typography>
                          </Box>
                        </Box>
                        {canAssignDesigner && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<MdDelete />}
                            onClick={() => {
                              setAssignmentId(assignment.id);
                              setDeleteDesigner(true);
                              setAssignOpen(true);
                            }}
                          >
                            إزالة
                          </Button>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ p: 3, textAlign: "center" }}>
                      <Typography variant="body1" color="text.secondary">
                        لا يوجد مصممون معيّنون لهذا المشروع بعد
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        </Card>
      )}

      {renderTasks && <ProjectTasksPanel project={project} />}

      {assignOpen && (
        <AssignDesignerModal
          open={assignOpen}
          setOpen={setAssignOpen}
          project={project}
          assignmentId={assignmentId}
          deleteDesigner={deleteDesigner}
          onUpdated={(updated) => onUpdate?.(updated)}
        />
      )}
    </>
  );
}

export default ProjectDetails;
