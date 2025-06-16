import { DEPARTMENTS } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useEffect, useState } from "react";

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  TextField,
  Box,
  Typography,
  Checkbox,
  Chip,
  DialogActions,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from "@mui/material";
import { MdAdd, MdCheckCircle, MdAdminPanelSettings } from "react-icons/md";

export const CreateUpdateModal = ({
  clientLeadId,
  onCreate,
  currentUserDepartment,
  simpleButton,
}) => {
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    sharedDepartments: [],
  });
  const [department, setDepartment] = useState(currentUserDepartment);
  const [errors, setErrors] = useState({});
  const { setAlertError } = useAlertContext();
  const { setLoading } = useToastContext();

  useEffect(() => {
    if (createModalOpen) {
      setFormData({
        title: "",
        description: "",
        sharedDepartments: currentUserDepartment ? [currentUserDepartment] : [],
      });
      setDepartment(currentUserDepartment); // Reset department selection
      setErrors({});
    }
  }, [createModalOpen, currentUserDepartment]);

  const handleSubmit = async () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
      setAlertError("Title is required");
    }

    if (formData.sharedDepartments.length === 0) {
      newErrors.departments = "At least one department must be selected";
      setAlertError("At least one department must be selected");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const request = await handleRequestSubmit(
      formData,
      setLoading,
      `shared/client-leads/${clientLeadId}/updates?department=${department}&`,
      false,
      "Creating"
    );
    if (request.status === 200) {
      if (onCreate) {
        onCreate(request.data);
      }
      onClose();
    }
  };

  const handleDepartmentChange = (dept) => {
    if (dept === department) {
      return;
    }

    if (dept === currentUserDepartment && !isAdmin) {
      return;
    }

    // Handle ADMIN department logic
    if (dept === "ADMIN") {
      if (formData.sharedDepartments.includes("ADMIN")) {
        // If ADMIN is already selected, remove it
        setFormData((prev) => ({
          ...prev,
          sharedDepartments: prev.sharedDepartments.filter(
            (d) => d !== "ADMIN"
          ),
        }));
      } else {
        // If selecting ADMIN, clear all other departments except main department and show alert
        setAlertError(
          "If you select Admin, you can't share this with any other department"
        );
        const mainDept = department || currentUserDepartment;
        setFormData((prev) => ({
          ...prev,
          sharedDepartments: mainDept ? ["ADMIN", mainDept] : ["ADMIN"],
        }));
      }
      return;
    }

    // Handle other departments when ADMIN is selected
    if (formData.sharedDepartments.includes("ADMIN")) {
      setAlertError(
        "You have to unselect Admin if you want to share with other departments"
      );
      return;
    }

    // Regular department selection logic
    setFormData((prev) => ({
      ...prev,
      sharedDepartments: prev.sharedDepartments.includes(dept)
        ? prev.sharedDepartments.filter((d) => d !== dept)
        : [...prev.sharedDepartments, dept],
    }));
  };

  const handleMainDepartmentChange = (event) => {
    const newDepartment = event.target.value;
    setDepartment(newDepartment);

    // Automatically include the selected main department in shared departments
    if (!formData.sharedDepartments.includes(newDepartment)) {
      setFormData((prev) => ({
        ...prev,
        sharedDepartments: [...prev.sharedDepartments, newDepartment],
      }));
    }
  };

  function onClose() {
    setCreateModalOpen(false);
  }

  return (
    <>
      <Button
        variant="contained"
        startIcon={!simpleButton ? <MdAdd /> : null}
        onClick={() => setCreateModalOpen(true)}
        size={simpleButton ? "small" : "medium"}
        sx={{ borderRadius: 2 }}
      >
        Create Update
      </Button>
      <Dialog
        open={createModalOpen}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle>Create New Update</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              error={!!errors.title}
              helperText={errors.title}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              multiline
              rows={3}
              fullWidth
            />

            {/* Admin Main Department Selection */}
            {isAdmin && (
              <>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <MdAdminPanelSettings size={20} color="#ff9800" />
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, color: "#ff9800" }}
                    >
                      Admin Settings
                    </Typography>
                  </Box>
                  <FormControl fullWidth>
                    <InputLabel>Main Department</InputLabel>
                    <Select
                      value={department || ""}
                      onChange={handleMainDepartmentChange}
                      label="Main Department"
                      sx={{ borderRadius: 2 }}
                    >
                      {DEPARTMENTS.map((dept) => {
                        if (dept.value === "ADMIN" && isAdmin) return;
                        return (
                          <MenuItem key={dept.value} value={dept.value}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: "50%",
                                  backgroundColor: dept.color,
                                }}
                              />
                              {dept.label}
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Box>
                <Divider />
              </>
            )}

            <Box>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                Departments Access
              </Typography>
              {errors.departments && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.departments}
                </Alert>
              )}

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {DEPARTMENTS.map((dept) => {
                  const isChecked = formData.sharedDepartments.includes(
                    dept.value
                  );
                  const isDisabled =
                    (dept.value === currentUserDepartment && !isAdmin) ||
                    dept.value === department || // Main department is always disabled for toggling
                    (dept.value === "ADMIN" && isAdmin); // Admin department is disabled for admin users
                  const isMainDepartment = dept.value === department;
                  if (dept.value === "ADMIN" && isAdmin) return;
                  return (
                    <Box
                      key={dept.value}
                      onClick={() =>
                        !isDisabled && handleDepartmentChange(dept.value)
                      }
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        p: 2,
                        borderRadius: 2,
                        border: "2px solid",
                        borderColor: isChecked ? dept.color : "grey.300",
                        backgroundColor: isChecked
                          ? `${dept.color}08`
                          : "transparent",
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        opacity: isDisabled ? 0.7 : 1,
                        transition: "all 0.2s ease-in-out",
                        "&:hover": !isDisabled && {
                          borderColor: dept.color,
                          backgroundColor: `${dept.color}04`,
                          transform: "translateY(-1px)",
                          boxShadow: `0 4px 12px ${dept.color}20`,
                        },
                      }}
                    >
                      {/* Custom Checkbox */}
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          border: "2px solid",
                          borderColor: isChecked ? dept.color : "grey.400",
                          backgroundColor: isChecked
                            ? dept.color
                            : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mr: 2,
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        {isChecked && (
                          <MdCheckCircle
                            size={16}
                            color="white"
                            style={{
                              animation: "checkScale 0.2s ease-in-out",
                            }}
                          />
                        )}
                      </Box>

                      {/* Department Info */}
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: isChecked ? 600 : 400,
                            color: isChecked ? dept.color : "text.primary",
                          }}
                        >
                          {dept.label}
                        </Typography>

                        {isMainDepartment && (
                          <Chip
                            label="Main"
                            size="small"
                            sx={{
                              backgroundColor: "#ff9800",
                              color: "white",
                              fontWeight: 500,
                              fontSize: "0.75rem",
                            }}
                          />
                        )}

                        {dept.value === currentUserDepartment &&
                          !isAdmin &&
                          !isMainDepartment && (
                            <Chip
                              label="Required"
                              size="small"
                              sx={{
                                backgroundColor: dept.color,
                                color: "white",
                                fontWeight: 500,
                                fontSize: "0.75rem",
                              }}
                            />
                          )}

                        {dept.value === "ADMIN" && isAdmin && (
                          <Chip
                            label="Not Available"
                            size="small"
                            sx={{
                              backgroundColor: "grey.400",
                              color: "white",
                              fontWeight: 500,
                              fontSize: "0.75rem",
                            }}
                          />
                        )}

                        {isChecked && !isDisabled && !isMainDepartment && (
                          <Chip
                            label="Selected"
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: dept.color,
                              color: dept.color,
                              fontWeight: 500,
                              fontSize: "0.75rem",
                            }}
                          />
                        )}
                      </Box>

                      {/* Visual Indicator */}
                      <Box
                        sx={{
                          width: 8,
                          height: 32,
                          borderRadius: 1,
                          backgroundColor: isChecked
                            ? dept.color
                            : "transparent",
                          transition: "all 0.2s ease-in-out",
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Create Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
