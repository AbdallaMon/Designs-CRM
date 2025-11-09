import { DEPARTMENTS } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Fade,
  IconButton,
  Stack,
  Typography,
  Switch,
  FormControlLabel,
  Grid,
  Tooltip,
  Avatar,
  AvatarGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
} from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import {
  MdArchive as ArchiveIcon,
  MdUnarchive as UnarchiveIcon,
  MdSchedule as ScheduleIcon,
  MdPerson as PersonIcon,
  MdBusiness as BusinessIcon,
  MdSettings as SettingsIcon,
  MdVisibility as VisibilityIcon,
  MdAccessTime as AccessTimeIcon,
  MdMoreVert as MoreVertIcon,
  MdNote as NoteIcon,
  MdCheckCircle as CheckCircleIcon,
  MdRadioButtonUnchecked as RadioButtonUncheckedIcon,
  MdDelete,
  MdUndo,
} from "react-icons/md";
import { NotesComponent } from "../../utility/Notes";
import { getData } from "@/app/helpers/functions/getData";
import DeleteModelButton from "../../../common/DeleteModelButton";

const getDepartmentConfig = (dept) =>
  DEPARTMENTS.find((d) => d.value === dept) || { label: dept, color: "#666" };

export const UpdateCard = ({
  update,
  onToggleArchive,
  onUpdate,
  currentUserDepartment,
  filter,
  isSimple,
}) => {
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  const canManageDepartments = update.createdById === user?.id || isAdmin;
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const mainDepartment = getDepartmentConfig(update.department);

  const userSharedUpdate = update.sharedSettings.find(
    (shared) => shared.type === currentUserDepartment
  );
  const adminSharedUpdate = isAdmin
    ? update.sharedSettings.find((shared) => shared.type === "ADMIN")
    : null;
  const isArchived = canManageDepartments
    ? adminSharedUpdate
      ? adminSharedUpdate.isArchived
      : update.sharedSettings
          .filter((shared) => shared.type !== mainDepartment.type)
          .every((shared) => shared.isArchived)
    : userSharedUpdate.isArchived;
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleOpenNotes = () => {
    handleMenuClose();
    setNoteOpen(true);
  };

  const formatRelativeTime = (dateString) => {
    const date = dayjs(dateString);
    const now = dayjs();
    const diffDays = now.diff(date, "day");

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.format("DD/MM/YYYY");
  };

  const getAuthorizedCount = () => {
    return update.sharedSettings?.length || 0;
  };

  const ActionMenu = () => (
    <Menu
      anchorEl={menuAnchorEl}
      open={Boolean(menuAnchorEl)}
      onClose={handleMenuClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          minWidth: 160,
        },
      }}
    >
      <MenuItem onClick={handleOpenNotes}>
        <ListItemIcon sx={{ minWidth: 36 }}>
          <NoteIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={"Manage notes"} />
      </MenuItem>

      {((adminSharedUpdate && !isArchived) ||
        (!canManageDepartments && !isArchived)) && (
        <MarkAsDoneModel
          handleMenuClose={handleMenuClose}
          isArchived={isArchived}
          onToggleArchive={onToggleArchive}
          sharedUpdate={
            adminSharedUpdate ? adminSharedUpdate : userSharedUpdate
          }
          update={update}
          onUpdate={onUpdate}
        />
      )}
    </Menu>
  );

  if (filter && filter === "notArchived" && isArchived) {
    return;
  }
  return (
    <>
      <Dialog open={noteOpen} onClose={() => setNoteOpen(false)}>
        <DialogContent>
          <NotesComponent
            idKey={"updateId"}
            id={update.id}
            slug="shared"
            showAddNotes={true}
            isOpen={noteOpen}
            simpleButton={true}
            onClose={() => setNoteOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Fade in={true}>
        <Card
          sx={{
            mb: 2,
            border: "1px solid",
            borderColor: update.isArchived ? "grey.300" : "grey.200",
            opacity: update.isArchived ? 0.85 : 1,
            transition: "all 0.3s ease",
            backgroundColor: `${mainDepartment.color}20`,
            "& .MuiCardContent-root": {
              padding: "12px !important",
            },
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
              mb={1}
            >
              <Box flex={1} mr={1}>
                <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontWeight: 600,
                      color: update.isArchived
                        ? "text.secondary"
                        : "text.primary",
                    }}
                  >
                    {update.title}
                  </Typography>
                </Box>

                {update.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.6,
                      mb: 1.2,
                    }}
                  >
                    {update.description}
                  </Typography>
                )}
              </Box>

              {/* Three Dots Menu Button */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 0.5,
                    alignItems: "center",
                  }}
                >
                  {canManageDepartments && (
                    <DeleteModelButton
                      item={update}
                      model={"ClientLeadUpdate"}
                      contentKey="title"
                      onDelete={() => {
                        window.location.reload();
                      }}
                      deleteModelesBeforeMain={[
                        { name: "Note", key: "updateId" },
                        { name: "SharedUpdate", key: "updateId" },
                      ]}
                    />
                  )}
                  <Tooltip title="More actions">
                    <IconButton
                      onClick={handleMenuOpen}
                      size="small"
                      sx={{
                        color: "text.secondary",
                        backgroundColor: "transparent",
                        "&:hover": {
                          backgroundColor: "action.hover",
                          color: "text.primary",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                {isArchived && (
                  <Chip
                    label="Done"
                    size="small"
                    color="success"
                    variant="outlined"
                    icon={<CheckCircleIcon fontSize="small" />}
                    sx={{
                      height: 24,
                      fontSize: "0.7rem",
                      fontWeight: 500,
                    }}
                  />
                )}
              </Box>
            </Box>

            <Box mb={1.2}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
                sx={{ fontSize: "0.8rem", fontWeight: 600, mb: 1 }}
              >
                Primary Department
              </Typography>
              <Chip
                icon={<BusinessIcon />}
                label={mainDepartment.label}
                sx={{
                  backgroundColor: mainDepartment.color + "15",
                  color: mainDepartment.color,
                  fontWeight: 600,
                  border: `1px solid ${mainDepartment.color}30`,
                  fontSize: "0.85rem",
                  height: 32,
                }}
              />
            </Box>
            {canManageDepartments && (
              <Box mb={2.5}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1.5}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ fontSize: "0.8rem", fontWeight: 600 }}
                  >
                    Shared Access ({getAuthorizedCount()}/
                    {DEPARTMENTS.length - 1} departments)
                  </Typography>
                  {canManageDepartments && (
                    <DepartmentManagementModal
                      onUpdate={onUpdate}
                      update={update}
                    />
                  )}
                </Box>
                {!isSimple && (
                  <>
                    {update.sharedSettings &&
                    update.sharedSettings.length > 0 ? (
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        gap={1}
                      >
                        {update.sharedSettings
                          .slice(0, 4)
                          .map((shared, index) => {
                            const deptConfig = getDepartmentConfig(shared.type);
                            return (
                              <Chip
                                key={index}
                                avatar={
                                  <Avatar
                                    sx={{
                                      bgcolor: deptConfig.color + "20",
                                      color: deptConfig.color,
                                      width: 24,
                                      height: 24,
                                    }}
                                  >
                                    <PersonIcon fontSize="small" />
                                  </Avatar>
                                }
                                label={deptConfig.label}
                                variant="outlined"
                                size="small"
                                sx={{
                                  borderColor: deptConfig.color + "40",
                                  color: deptConfig.color,
                                  fontWeight: 500,
                                }}
                              />
                            );
                          })}
                        {update.sharedSettings.length > 4 && (
                          <Chip
                            label={`+${update.sharedSettings.length - 4} more`}
                            variant="filled"
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 500 }}
                          />
                        )}
                      </Stack>
                    ) : (
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "grey.50",
                          borderRadius: 1,
                          border: "1px dashed",
                          borderColor: "grey.300",
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          align="center"
                          sx={{ fontStyle: "italic" }}
                        >
                          No additional departments have access
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
            <Divider sx={{ my: 1.5 }} />

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              sx={{ pt: 1 }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  sx={{ fontSize: "0.75rem" }}
                >
                  <ScheduleIcon fontSize="small" />
                  Created {formatRelativeTime(update.createdAt)}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  sx={{ fontSize: "0.75rem" }}
                >
                  <AccessTimeIcon fontSize="small" />
                  Updated {formatRelativeTime(update.updatedAt)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Fade>

      <ActionMenu />
    </>
  );
};

function DepartmentManagementModal({ update, onUpdate }) {
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [sharedSettings, setSharedSettings] = useState([]);
  const [loadingData, setLoadingData] = useState();
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  const [authorizedDepartmentIds, setAuthorizedDepartmentsId] = useState(
    new Set()
  );
  const [confirmationDialog, setConfirmationDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const { setLoading } = useToastContext();

  useEffect(() => {
    async function getSharedSettings() {
      const requestData = await getData({
        url: `shared/client-leads/shared-settings/${update.id}`,
        setLoading: setLoadingData,
      });
      if (requestData && requestData.status === 200) {
        setSharedSettings(requestData.data);
        setAuthorizedDepartmentsId(
          new Set(requestData.data?.map((shared) => shared.type) || [])
        );
      }
    }
    getSharedSettings();
  }, [update]);

  const handleDepartmentToggle = async (
    departmentValue,
    isCurrentlyAuthorized
  ) => {
    if (departmentValue === update.department && isCurrentlyAuthorized) {
      return;
    }
    if (
      !isCurrentlyAuthorized &&
      departmentValue !== "ADMIN" &&
      authorizedDepartmentIds.has("ADMIN")
    ) {
      setConfirmationDialog({
        open: true,
        title: "Unauthorize Admin Required",
        message:
          "In order to authorize another department, you have to unauthorize Admin first. Do you want to continue?",
        onConfirm: async () => {
          // First unauthorize ADMIN
          await performDepartmentToggle("ADMIN", true);
          // Then authorize the requested department
          await performDepartmentToggle(departmentValue, false);
          setConfirmationDialog({
            open: false,
            title: "",
            message: "",
            onConfirm: null,
          });
        },
      });
      return;
    }

    // Check if trying to authorize ADMIN while other departments are authorized
    if (!isCurrentlyAuthorized && departmentValue === "ADMIN") {
      const otherAuthorizedDepts = Array.from(authorizedDepartmentIds).filter(
        (dept) => dept !== "ADMIN" && dept !== update.department
      );

      if (otherAuthorizedDepts.length > 0) {
        setConfirmationDialog({
          open: true,
          title: "Unauthorize Other Departments Required",
          message:
            "In order to authorize Admin, you have to unauthorize all other departments first. Do you want to continue?",
          onConfirm: async () => {
            // First unauthorize all other departments (except main department)
            for (const dept of otherAuthorizedDepts) {
              await performDepartmentToggle(dept, true);
            }
            // Then authorize ADMIN
            await performDepartmentToggle("ADMIN", false);
            setConfirmationDialog({
              open: false,
              title: "",
              message: "",
              onConfirm: null,
            });
          },
        });
        return;
      }
    }

    // Regular toggle for other cases
    await performDepartmentToggle(departmentValue, isCurrentlyAuthorized);
  };

  const performDepartmentToggle = async (
    departmentValue,
    isCurrentlyAuthorized
  ) => {
    const url = !isCurrentlyAuthorized
      ? `shared/client-leads/updates/${update.id}/authorize`
      : `shared/client-leads/updates/${update.id}/authorize/shared`;

    const request = await handleRequestSubmit(
      { type: departmentValue },
      setLoading,
      url,
      false,
      isCurrentlyAuthorized ? "UnAuthorize" : "Authorize"
    );

    if (request.status === 200) {
      setSharedSettings(request.data.sharedSettings);
      setAuthorizedDepartmentsId(
        new Set(request.data.sharedSettings?.map((shared) => shared.type) || [])
      );
      if (onUpdate) {
        await onUpdate(request.data);
      }
    }
  };

  const getAuthorizedCount = () => {
    return sharedSettings?.length || 0;
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<SettingsIcon />}
        onClick={() => setIsDepartmentModalOpen(true)}
        sx={{
          fontSize: "0.75rem",
          py: 0.5,
          px: 1.5,
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 500,
        }}
      >
        Manage Access
      </Button>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmationDialog.open}
        onClose={() =>
          setConfirmationDialog({
            open: false,
            title: "",
            message: "",
            onConfirm: null,
          })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{confirmationDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmationDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setConfirmationDialog({
                open: false,
                title: "",
                message: "",
                onConfirm: null,
              })
            }
          >
            Cancel
          </Button>
          <Button
            onClick={confirmationDialog.onConfirm}
            variant="contained"
            color="primary"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isDepartmentModalOpen}
        onClose={() => setIsDepartmentModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            pb: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 32,
              height: 32,
            }}
          >
            <SettingsIcon fontSize="small" />
          </Avatar>
          <Box flex={1}>
            <Typography variant="h6" component="h2">
              Department Authorization
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage access permissions for this update
            </Typography>
          </Box>
          <Chip
            size="small"
            label={`${getAuthorizedCount()} authorized`}
            color="primary"
            variant="outlined"
          />
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Toggle department access below. The primary department always has
            access by default.
          </Typography>

          <Grid container spacing={2}>
            {!loadingData &&
              DEPARTMENTS.map((department) => {
                const isAuthorized = authorizedDepartmentIds?.has(
                  department.value
                );
                const currentSharedSetting = sharedSettings.find(
                  (shared) => shared.type === department.value
                );
                const isMainDept = department.value === update.department;

                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={department.value}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        height: "100%",
                        backgroundColor: isMainDept
                          ? department.color + "15"
                          : isAuthorized
                          ? department.color + "08"
                          : "transparent",
                        borderColor: isMainDept
                          ? department.color
                          : isAuthorized
                          ? department.color + "40"
                          : "divider",
                        position: "relative",
                        transition: "all 0.2s ease",
                        cursor: isMainDept ? "default" : "pointer",
                        "&:hover": {
                          borderColor: isMainDept
                            ? department.color
                            : department.color + "60",
                          transform: isMainDept ? "none" : "translateY(-2px)",
                          boxShadow: isMainDept
                            ? "none"
                            : "0 4px 12px rgba(0,0,0,0.1)",
                        },
                      }}
                    >
                      {isMainDept && (
                        <Chip
                          label="Primary"
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            backgroundColor: department.color,
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "0.7rem",
                          }}
                        />
                      )}
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        gap={1.5}
                      >
                        <Avatar
                          sx={{
                            bgcolor: department.color + "20",
                            color: department.color,
                            width: 40,
                            height: 40,
                          }}
                        >
                          <BusinessIcon />
                        </Avatar>

                        <Typography
                          variant="subtitle2"
                          align="center"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            lineHeight: 1.2,
                          }}
                        >
                          {department.label}
                        </Typography>

                        {isMainDept ? (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            align="center"
                            sx={{ fontWeight: 500 }}
                          >
                            Always Authorized
                          </Typography>
                        ) : (
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Switch
                                checked={isAuthorized}
                                color="primary"
                                size="small"
                                onChange={() => {
                                  if (!isMainDept) {
                                    handleDepartmentToggle(
                                      department.value,
                                      isAuthorized
                                    );
                                  }
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 500,
                                  color: isAuthorized
                                    ? "success.main"
                                    : "text.secondary",
                                }}
                              >
                                {isAuthorized ? "Authorized" : "Unauthorized"}
                              </Typography>
                            </Box>
                            {currentSharedSetting && isAdmin && (
                              <MarkAsDoneModel
                                isArchived={currentSharedSetting.isArchived}
                                sharedUpdate={currentSharedSetting}
                                update={update}
                                onUpdate={onUpdate}
                                onToggleArchive={(update, isArchived) => {
                                  setSharedSettings((oldShared) =>
                                    oldShared.map((s) => {
                                      if (s.id === currentSharedSetting.id) {
                                        return { ...s, isArchived };
                                      } else {
                                        return s;
                                      }
                                    })
                                  );
                                }}
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setIsDepartmentModalOpen(false)}
            variant="contained"
            sx={{ minWidth: 100 }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function MarkAsDoneModel({
  handleMenuClose,
  sharedUpdate,
  isArchived,
  onToggleArchive,
  update,
  onUpdate,
}) {
  const [markDoneOpen, setMarkDoneOpen] = useState(false);
  const { setLoading } = useToastContext();
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  const actionText = isArchived ? "Mark as Undone" : "Mark as Done";
  const confirmText = isArchived
    ? "Are you sure you want to mark this update as undone? This will make it active again."
    : "Are you sure you want to mark this update as done? This action cannot be changed once confirmed.";
  const dialogTitle = isArchived ? "Mark as Undone" : "Mark as Done";
  const iconComponent = isArchived ? (
    <MdUndo fontSize="small" color="warning" /> // Use Undo icon and possibly a different color
  ) : (
    <CheckCircleIcon fontSize="small" color="success" />
  );
  const buttonColor = isArchived ? "warning" : "success";
  const buttonStartIcon = isArchived ? <MdUndo /> : <CheckCircleIcon />;
  const avatarBgColor = isArchived ? "warning.main" : "success.main";
  const avatarIcon = isArchived ? (
    <MdUndo fontSize="small" />
  ) : (
    <CheckCircleIcon fontSize="small" />
  );
  if (!isAdmin && isArchived) return;
  const handleOpenMarkDone = () => {
    // if (handleMenuClose) {
    //   handleMenuClose();
    // }
    setMarkDoneOpen(true);
  };

  const handleMarkAsDone = async () => {
    const url = `shared/client-leads/shared-updates/${sharedUpdate.id}/archive`;
    const request = await handleRequestSubmit(
      {
        isArchived: !isArchived,
      },
      setLoading,
      url,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (request.status === 200) {
      if (onToggleArchive) {
        onToggleArchive(request.data, !isArchived);
      }
      setMarkDoneOpen(false);
      if (handleMenuClose) {
        handleMenuClose();
      }
      if (onUpdate) {
        onUpdate(request.data);
      }
    }
  };

  return (
    <>
      <MenuItem onClick={handleOpenMarkDone}>
        <ListItemIcon sx={{ minWidth: 36 }}>
          {iconComponent} {/* Dynamic icon */}
        </ListItemIcon>
        <ListItemText
          primary={actionText}
          primaryTypographyProps={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: `${buttonColor}.main`, // Dynamic color
          }}
        />
      </MenuItem>

      <Dialog
        open={markDoneOpen}
        onClose={() => setMarkDoneOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            pb: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Avatar
            sx={{
              bgcolor: avatarBgColor, // Dynamic background color
              width: 32,
              height: 32,
            }}
          >
            {avatarIcon} {/* Dynamic avatar icon */}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h6" component="h2">
              {dialogTitle} {/* Dynamic dialog title */}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isArchived
                ? "Revert update status"
                : "Confirm completion of this update"}{" "}
              {/* Dynamic subtitle */}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {confirmText} {/* Dynamic confirmation message */}
          </Typography>

          <Box
            sx={{
              p: 2,
              backgroundColor: "grey.50",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "grey.200",
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Update Details:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Title:</strong> {update.title}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2, gap: 1 }}>
          <Button
            onClick={() => setMarkDoneOpen(false)}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMarkAsDone}
            variant="contained"
            color={buttonColor} // Dynamic button color
            startIcon={buttonStartIcon} // Dynamic button icon
            sx={{ minWidth: 120 }}
          >
            {actionText} {/* Dynamic button text */}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
