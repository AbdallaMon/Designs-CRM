import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Checkbox,
  FormControlLabel,
  Typography,
  Divider,
  Box,
  Chip,
  Alert,
  Avatar,
  Grid,
  Card,
  Switch,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useState, useEffect } from "react";
import { MdBusiness, MdCheckCircle, MdSettings, MdUndo } from "react-icons/md";
import { DEPARTMENTS } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { getData } from "@/app/helpers/functions/getData";

const getDepartmentConfig = (dept) =>
  DEPARTMENTS.find((d) => d.value === dept) || { label: dept, color: "#666" };

/**
 * DepartmentManagementModal Component
 * Allows authorized users to manage which departments can see an update
 */
export function DepartmentManagementModal({ update, onUpdate }) {
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
        url: `shared/updates/shared-settings/${update.id}`,
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
      ? `shared/updates/${update.id}/authorize`
      : `shared/updates/${update.id}/authorize/shared`;

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
        startIcon={<MdSettings />}
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
            <MdSettings fontSize="small" />
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
                const currentSharedSetting = sharedSettings?.find(
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
                          <MdBusiness />
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
    <MdCheckCircle fontSize="small" color="success" />
  );
  const buttonColor = isArchived ? "warning" : "success";
  const buttonStartIcon = isArchived ? <MdUndo /> : <MdCheckCircle />;
  const avatarBgColor = isArchived ? "warning.main" : "success.main";
  const avatarIcon = isArchived ? (
    <MdUndo fontSize="small" />
  ) : (
    <MdCheckCircle fontSize="small" />
  );
  if (!isAdmin && isArchived) return;
  const handleOpenMarkDone = () => {
    // if (handleMenuClose) {
    //   handleMenuClose();
    // }
    setMarkDoneOpen(true);
  };

  const handleMarkAsDone = async () => {
    const url = `shared/updates/shared-updates/${sharedUpdate.id}/archive`;
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
