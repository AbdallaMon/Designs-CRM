import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  Divider,
  Collapse,
  lighten,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  MdAdd as AddIcon,
  MdEdit as EditIcon,
  MdDelete as DeleteIcon,
  MdVisibility as VisibilityIcon,
  MdBusiness as BusinessIcon,
  MdConstruction as ConstructionIcon,
  MdArticle as ArticleIcon,
  MdExpandMore,
  MdExpandLess,
  MdPlayArrow as CurrentIcon,
  MdCheckCircle as CompletedIcon,
} from "react-icons/md";
import { contractLevelColors } from "@/app/helpers/colors";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { getData } from "@/app/helpers/functions/getData";
import dayjs from "dayjs";
import { NotesComponent } from "../../utility/Notes";
import DeleteModelButton from "./DeleteModelButton";

const CONTRACT_LEVELS = {
  LEVEL_1: "تحليل وتقييم",
  LEVEL_2: "تخطيط المساحات", 
  LEVEL_3: "تصميم 3D",
  LEVEL_4: "مخططات تنفيذية",
  LEVEL_5: "حساب كميات واسعار",
  LEVEL_6: "تنفيذ",
  LEVEL_7: "تسويق"
};

const ContractManagement = ({ leadId = 1 }) => {
  const [contracts, setContracts] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const { setLoading: setToatsLoading } = useToastContext();
  const [dialogType, setDialogType] = useState(""); // 'new-purpose', 'edit-contract', 'new-level', 'view-details'
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [collapsedSections, setCollapsedSections] = useState({});
  const { setAlertError } = useAlertContext();
  const [formData, setFormData] = useState({
    purpose: "",
    contractLevel: [],
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchContracts();
  }, [leadId]);

  const fetchContracts = async () => {
    const req = await getData({
      url: `shared/client-leads/${leadId}/contracts`,
      setLoading: setLoading,
    });
    if (req.status === 200) {
      setPurposes(Object.keys(req.data));
      setContracts(Object.values(req.data).flat());
    }
  };

  const getUniquePurposes = () => {
    return purposes;
  };



  const hasContractForLevel = (purpose, level) => {
    return contracts.some(
      (contract) =>
        contract.purpose === purpose && contract.contractLevel === level
    );
  };

  const getContractForLevel = (purpose, level) => {
    return contracts.find(
      (contract) =>
        contract.purpose === purpose && contract.contractLevel === level
    );
  };

  const isCurrentLevel = (purpose, level, contract) => {
    return contract?.isInProgress;
  };

  const isCompletedLevel = (purpose, level, contract) => {
    return contract?.isCompleted;
  };

  const getAvailableLevelsForEdit = (purpose) => {
    return Object.keys(CONTRACT_LEVELS).filter((level) => {
      return !hasContractForLevel(purpose, level);
    });
  };

  const toggleSection = (purpose) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [purpose]: !prev[purpose],
    }));
  };

  const handleToggleStatus = async (purpose, level, statusType) => {
    const contract = getContractForLevel(purpose, level);
    if (!contract) return;

    const updateData = {
      isInProgress: statusType === 'current' ? !contract.isInProgress : contract.isInProgress,
      isCompleted: statusType === 'completed' ? !contract.isCompleted : contract.isCompleted,
      
    };

    if (statusType === 'current' && updateData.isInProgress) {
      updateData.isCompleted = false;
    }
    
    if (statusType === 'completed' && updateData.isCompleted) {
      updateData.isInProgress = false;
    }

    const req = await handleRequestSubmit(
      updateData,
      setToatsLoading,
      `shared/client-leads/contract/${contract.id}/${statusType}`,
      false,
      "Updating Contract Status",
      false,
      "PUT"
    );

    if (req.status === 200) {
      await fetchContracts();
    }
  };

  const handleOpenDialog = (type, contract = null, purpose = "") => {
    setDialogType(type);
    setSelectedContract(contract);
    setSelectedPurpose(purpose);

    if (contract) {
      const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toISOString().split("T")[0];
      };
      setFormData({
        purpose: contract.purpose,
        contractLevel: contract.contractLevel,
        startDate: formatDate(contract.startDate) || "",
        endDate: formatDate(contract.endDate) || "",
      });
    } else {
      setFormData({
        purpose: purpose || "",
        contractLevel: [],
        startDate: "",
        endDate: "",
      });
    }

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedContract(null);
    setSelectedPurpose("");
    setFormData({
      purpose: "",
      contractLevel: [],
      startDate: "",
      endDate: "",
    });
  };

  const handleSaveContract = async () => {
    if (!formData.purpose || !formData.contractLevel || formData.contractLevel.length < 1) {
      setAlertError("Please fill in all required fields.");
      return;
    }
    
    const url = selectedContract
      ? `shared/client-leads/contract/${selectedContract.id}`
      : `shared/client-leads/${leadId}/contracts`;
    const method = selectedContract ? "PUT" : "POST";
    
    const req = await handleRequestSubmit(
      formData,
      setToatsLoading,
      url,
      false,
      "Saving Contract",
      false,
      method
    );
    
    if (req.status === 200 || req.status === 201) {
      await fetchContracts();
      handleCloseDialog();
    }
  };

  const getLevelColor = (purpose, level, contract) => {
    if (isCurrentLevel(purpose, level, contract)) {
      return "#4caf50"; // Green for current
    }
    if (isCompletedLevel(purpose, level, contract)) {
      return "#2196f3"; // Blue for completed
    }
    return contractLevelColors[level] || "#9e9e9e";
  };

  const getPurposeIcon = (purpose) => {
    switch (purpose.toLowerCase()) {
      case "design":
        return <ArticleIcon />;
      case "construction":
        return <ConstructionIcon />;
      default:
        return <BusinessIcon />;
    }
  };

  const getStatusChip = (contract) => {
    if (contract?.isInProgress) {
      return <Chip label="Current" size="small" color="success" sx={{ mt: 1 }} />;
    }
    if (contract?.isCompleted) {
      return <Chip label="Completed" size="small" color="primary" sx={{ mt: 1 }} />;
    }
    return <Chip label="Not Started" size="small" color="default" sx={{ mt: 1 }} />;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="50px"
      >
        <Typography>Loading contracts...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0, mb: 1.5 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={1.5}
      >
        <Typography variant="h4" component="h1">
          Contract Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog("new-purpose")}
        >
          New Contract Purpose
        </Button>
      </Box>

      {getUniquePurposes().length === 0 ? (
        <Alert severity="info">
          No contracts found for this lead. Click &quot;New Contract
          Purpose&quot; to create one.
        </Alert>
      ) : (
        getUniquePurposes().map((purpose) => (
          <Paper key={purpose} sx={{ mb: 3, p: 2 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
              sx={{ cursor: "pointer" }}
              onClick={() => toggleSection(purpose)}
            >
              <Box display="flex" alignItems="center" gap={1}>
                {getPurposeIcon(purpose)}
                <Typography variant="h5" component="h2">
                  {purpose}
                </Typography>
                <IconButton size="small">
                  {collapsedSections[purpose] ? (
                    <MdExpandMore />
                  ) : (
                    <MdExpandLess />
                  )}
                </IconButton>
              </Box>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDialog("new-level", null, purpose);
                }}
              >
                Add new Contract level
              </Button>
            </Box>

            <Collapse
              in={collapsedSections[purpose]}
              timeout="auto"
              unmountOnExit
            >
              <Grid container spacing={2}>
                {Object.entries(CONTRACT_LEVELS).map(([level, description]) => {
                  const hasContract = hasContractForLevel(purpose, level);
                  const contract = getContractForLevel(purpose, level);
                  const isCurrent = isCurrentLevel(purpose, level, contract);
                  const isCompleted = isCompletedLevel(purpose, level, contract);

                  return (
                    <Grid size={{ sm: 6, md: 4, lg: 3 }} key={level}>
                      <Card
                        sx={{
                          backgroundColor: lighten(
                            getLevelColor(purpose, level, contract),
                            0.85
                          ),
                          color: getLevelColor(purpose, level, contract),
                          border: isCurrent
                            ? "2px solid #4caf50"
                            : isCompleted
                            ? "2px solid #2196f3"
                            : "1px solid #ddd",
                          cursor: hasContract ? "pointer" : "default",
                          transition: "transform 0.2s",
                          "&:hover": {
                            transform: hasContract ? "scale(1.02)" : "none",
                          },
                        }}
                      >
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box flex={1}>
                              <Typography
                                color={getLevelColor(purpose, level, contract)}
                                variant="h6"
                                component="div"
                                sx={{ mb: 0.5 }}
                              >
                                {level.replace("_", " ")}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1, fontSize: '0.85rem' }}
                              >
                                {description}
                              </Typography>
                              {getStatusChip(contract)}
                            </Box>
                            
                            {hasContract && (
                              <Box display="flex" flexDirection="column" gap={0.5}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDialog("view-details", contract);
                                  }}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                                <DeleteModelButton
                                  item={contract}
                                  model={"contract"}
                                  contentKey="level"
                                  onDelete={() => {
                                    fetchContracts();
                                  }}
                                />
                              </Box>
                            )}
                          </Box>

                          {hasContract && (
                            <Box mt={2}>
                              <ToggleButtonGroup
                                size="small"
                                exclusive={false}
                                sx={{ display: 'flex', gap: 1 }}
                              >
                                <ToggleButton
                                  value="current"
                                  selected={isCurrent}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleStatus(purpose, level, 'current');
                                  }}
                                  sx={{
                                    px: 1,
                                    py: 0.5,
                                    fontSize: '0.75rem',
                                    minWidth: 'auto',
                                    '&.Mui-selected': {
                                      backgroundColor: '#4caf50',
                                      color: 'white',
                                    }
                                  }}
                                >
                                  <CurrentIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                                  Current
                                </ToggleButton>
                                <ToggleButton
                                  value="completed"
                                  selected={isCompleted}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleStatus(purpose, level, 'completed');
                                  }}
                                  sx={{
                                    px: 1,
                                    py: 0.5,
                                    fontSize: '0.75rem',
                                    minWidth: 'auto',
                                    '&.Mui-selected': {
                                      backgroundColor: '#2196f3',
                                      color: 'white',
                                    }
                                  }}
                                >
                                  <CompletedIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                                  Done
                                </ToggleButton>
                              </ToggleButtonGroup>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Collapse>
          </Paper>
        ))
      )}

      {/* Dialog for various operations */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {dialogType === "new-purpose" && "New Contract Purpose"}
            {dialogType === "new-level" &&
              `New Contract Level for ${selectedPurpose}`}
            {dialogType === "edit-contract" && "Edit Contract"}
            {dialogType === "view-details" && "Contract Details"}
            {dialogType === "view-details" && selectedContract && (
              <NotesComponent
                id={selectedContract.id}
                slug="shared"
                showAddNotes={true}
                idKey="contractId"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {dialogType === "view-details" && selectedContract ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                {CONTRACT_LEVELS[selectedContract.contractLevel]}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body1">
                    <strong>Purpose:</strong> {selectedContract.purpose}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body1">
                    <strong>Level:</strong>{" "}
                    {selectedContract.contractLevel.replace("_", " ")} - {CONTRACT_LEVELS[selectedContract.contractLevel]}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body1">
                    <strong>Start Date:</strong>{" "}
                    {selectedContract.startDate
                      ? dayjs(selectedContract.startDate).format("DD/MM/YYYY")
                      : "Not set"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body1">
                    <strong>End Date:</strong>{" "}
                    {selectedContract.endDate
                      ? dayjs(selectedContract.endDate).format("DD/MM/YYYY")
                      : "Not set"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body1">
                    <strong>Status:</strong>{" "}
                    {selectedContract.isInProgress 
                      ? "In Progress" 
                      : selectedContract.isCompleted 
                      ? "Completed" 
                      : "Not Started"}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Purpose"
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                  disabled={dialogType === "new-level"}
                />
              </Grid>
              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel>Contract Level</InputLabel>
                  <Select
                    multiple
                    value={formData.contractLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contractLevel: e.target.value,
                      })
                    }
                    label="Contract Level"
                    renderValue={(selected) => {
                      return (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip 
                              key={value} 
                              label={`${value.replace("_", " ")} - ${CONTRACT_LEVELS[value]}`} 
                              size="small"
                            />
                          ))}
                        </Box>
                      );
                    }}
                  >
                    {(dialogType === "new-level"
                      ? getAvailableLevelsForEdit(selectedPurpose)
                      : Object.keys(CONTRACT_LEVELS)
                    ).map((level) => (
                      <MenuItem key={level} value={level}>
                        <Box>
                          <Typography variant="body1">
                            {level.replace("_", " ")}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {CONTRACT_LEVELS[level]}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  helperText="Optional start date for the level"
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  helperText="Optional end date for the level"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {dialogType === "view-details" ? (
            <></>
          ) : (
            <Button onClick={handleSaveContract} variant="contained">
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractManagement;