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
  Grid2 as Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  Divider,
  Collapse,
  lighten,
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
} from "react-icons/md";
import { contractLevelColors } from "@/app/helpers/colors";
import { CONTRACT_LEVELS } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { getData } from "@/app/helpers/functions/getData";
import dayjs from "dayjs";
import { NotesComponent } from "../../utility/Notes";
import DeleteModelButton from "./DeleteModelButton";

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
    contractLevel: "",
    title: "",
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

  const getContractsByPurpose = (purpose) => {
    return contracts.filter((contract) => contract.purpose === purpose);
  };

  const getHighestLevelForPurpose = (purpose) => {
    const purposeContracts = getContractsByPurpose(purpose);
    if (purposeContracts.length === 0) return null;

    const levels = purposeContracts.map((contract) =>
      parseInt(contract.contractLevel.split("_")[1])
    );
    return Math.max(...levels);
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

  const isCurrentLevel = (purpose, level) => {
    const highestLevel = getHighestLevelForPurpose(purpose);
    return highestLevel === parseInt(level.split("_")[1]);
  };

  const getAvailableLevelsForEdit = (purpose) => {
    const highestLevel = getHighestLevelForPurpose(purpose);
    if (!highestLevel) return CONTRACT_LEVELS;

    return CONTRACT_LEVELS.filter((level) => {
      const levelNum = parseInt(level.split("_")[1]);
      return levelNum > highestLevel;
    });
  };

  const toggleSection = (purpose) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [purpose]: !prev[purpose],
    }));
  };

  const handleOpenDialog = (type, contract = null, purpose = "") => {
    setDialogType(type);
    setSelectedContract(contract);
    setSelectedPurpose(purpose);

    if (contract) {
      const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toISOString().split("T")[0]; // returns 'yyyy-MM-dd'
      };
      setFormData({
        purpose: contract.purpose,
        contractLevel: contract.contractLevel,
        title: contract.title || "",
        startDate: formatDate(contract.startDate) || "",
        endDate: formatDate(contract.endDate) || "",
      });
    } else {
      setFormData({
        purpose: purpose || "",
        contractLevel: "",
        title: "",
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
      contractLevel: "",
      title: "",
      startDate: "",
      endDate: "",
    });
  };

  const handleDeleteContract = async (contractId) => {
    const req = await handleRequestSubmit(
      {},
      setToatsLoading,
      `shared/client-leads/contract/${contractId}`,
      false,
      "Deleteing",
      false,
      "DELETE"
    );
    if (req.status === 200) {
      await fetchContracts();
    }
  };

  const handleSaveContract = async () => {
    if (!formData.purpose || !formData.contractLevel) {
      setAlertError("Please fill in all required fields.");
      return; // Stop saving if validation fails
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

  const getLevelColor = (purpose, level) => {
    return isCurrentLevel(purpose, level)
      ? "#4caf50"
      : contractLevelColors[level];
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
                Edit Contract
              </Button>
            </Box>

            <Collapse
              in={collapsedSections[purpose]}
              timeout="auto"
              unmountOnExit
            >
              <Grid container spacing={2}>
                {CONTRACT_LEVELS.map((level) => {
                  const hasContract = hasContractForLevel(purpose, level);
                  const contract = getContractForLevel(purpose, level);
                  const isCurrent = isCurrentLevel(purpose, level);

                  return (
                    <Grid size={{ sm: 6, md: 4, lg: 3 }} key={level}>
                      <Card
                        sx={{
                          backgroundColor: lighten(
                            getLevelColor(purpose, level),
                            0.85
                          ),
                          color: getLevelColor(purpose, level),
                          border: isCurrent
                            ? "2px solid #4caf50"
                            : "1px solid #ddd",
                          cursor: hasContract ? "pointer" : "default",
                          transition: "transform 0.2s",
                          "&:hover": {
                            transform: hasContract ? "scale(1.02)" : "none",
                          },
                        }}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography
                              color={getLevelColor(purpose, level)}
                              variant="h6"
                              component="div"
                            >
                              {level.replace("_", " ")}
                            </Typography>
                            {hasContract && (
                              <CardActions>
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
                              </CardActions>
                            )}
                          </Box>

                          {hasContract && (
                            <>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {contract.title}
                              </Typography>
                              <Chip
                                label={isCurrent ? "Current" : "Completed"}
                                size="small"
                                color={
                                  isCurrent
                                    ? "success"
                                    : getLevelColor(purpose, level)
                                }
                                sx={{ mt: 1 }}
                              />
                            </>
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
                {selectedContract.title}
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
                    {selectedContract.contractLevel.replace("_", " ")}
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
                    value={formData.contractLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contractLevel: e.target.value,
                      })
                    }
                    label="Contract Level"
                  >
                    {(dialogType === "new-level"
                      ? getAvailableLevelsForEdit(selectedPurpose)
                      : CONTRACT_LEVELS
                    ).map((level) => (
                      <MenuItem key={level} value={level}>
                        {level.replace("_", " ")}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  helperText="Optional title for the level"
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
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
            <Button
              onClick={() => setDialogType("edit-contract")}
              variant="contained"
            >
              Edit
            </Button>
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
