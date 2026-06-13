"use client";
import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Box,
  Typography,
  Autocomplete,
  TextField,
  CircularProgress,
  Divider,
} from "@mui/material";
import { countriesByRegion } from "@/app/helpers/constants";
import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  FiGlobe,
  FiMapPin,
  FiSearch,
  FiX,
  FiPlus,
  FiSave,
  FiAlertCircle,
} from "react-icons/fi";

// Flatten the countries by region into a single array
const allCountries = Object.values(countriesByRegion).flat();

const UserRestrictedCountries = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [restrictedCountries, setRestrictedCountries] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeRegion, setActiveRegion] = useState("");
  const { setLoading: setToastLoading } = useToastContext();
  useEffect(() => {
    if (open) {
      fetchRestrictedCountries();
    }
  }, [open, userId]);

  const fetchRestrictedCountries = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await getData({
        url: `admin/users/${userId}/restricted-countries`,
        setLoading,
      });
      setRestrictedCountries(response);
      setSelectedCountries([]);
    } catch (error) {
      console.error("Error fetching restricted countries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedCountries([]);
    setActiveRegion("");
  };

  const handleDelete = (country) => {
    setRestrictedCountries(restrictedCountries.filter((c) => c !== country));
  };

  const handleSubmit = async () => {
    const request = await handleRequestSubmit(
      { countries: restrictedCountries },
      setToastLoading,
      `admin/users/${userId}/restricted-countries`,
      false,
      "Updating"
    );
    if (request.status === 200) {
      handleClose();
    }
  };

  const handleCountrySelect = (event, newValue) => {
    // Only add countries that aren't already in the restricted list
    const filteredNewValues = newValue.filter(
      (country) => !restrictedCountries.includes(country)
    );

    setSelectedCountries(filteredNewValues);
  };

  const handleAddCountries = () => {
    setRestrictedCountries([...restrictedCountries, ...selectedCountries]);
    setSelectedCountries([]);
  };

  const handleRegionChange = (event, newRegion) => {
    setActiveRegion(newRegion || "");
  };

  const availableCountries = allCountries.filter(
    (country) => !restrictedCountries.includes(country)
  );

  const restrictedByRegion = {};
  restrictedCountries.forEach((country) => {
    const region =
      Object.keys(countriesByRegion).find((r) =>
        countriesByRegion[r].includes(country)
      ) || "Other";

    if (!restrictedByRegion[region]) {
      restrictedByRegion[region] = [];
    }
    restrictedByRegion[region].push(country);
  });

  return (
    <Box>
      <Button
        variant="contained"
        fullWidth
        color="primary"
        onClick={handleOpen}
        sx={{
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 600,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          transition: "all 0.2s ease",
        }}
      >
        Manage Restricted Countries
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            padding: "16px 24px",
            backgroundColor: (theme) => theme.palette.primary.main,
            color: "#fff",
            fontWeight: 600,
          }}
        >
          <FiMapPin style={{ marginRight: "8px" }} />
          Restricted Countries for User
        </DialogTitle>

        <DialogContent sx={{ padding: "24px" }}>
          {loading ? (
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box mb={3}>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <FiGlobe /> Select countries to restrict for this user:
                </Typography>

                <Box mb={2}>
                  <Autocomplete
                    id="continent-selector"
                    options={Object.keys(countriesByRegion)}
                    value={activeRegion}
                    onChange={handleRegionChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label="Select Region"
                        placeholder="All Regions"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <FiGlobe
                                style={{ color: "#666", marginRight: "8px" }}
                              />
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                          },
                        }}
                      />
                    )}
                  />
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                  <Autocomplete
                    multiple
                    id="country-selector"
                    options={
                      activeRegion
                        ? countriesByRegion[activeRegion].filter(
                            (c) => !restrictedCountries.includes(c)
                          )
                        : availableCountries
                    }
                    groupBy={(option) => {
                      if (activeRegion) return activeRegion;
                      return (
                        Object.keys(countriesByRegion).find((region) =>
                          countriesByRegion[region].includes(option)
                        ) || "Other"
                      );
                    }}
                    value={selectedCountries}
                    onChange={handleCountrySelect}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label="Select Countries"
                        placeholder="Type to search countries"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <FiSearch
                                style={{ color: "#666", marginRight: "8px" }}
                              />
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                          },
                        }}
                      />
                    )}
                    sx={{ flexGrow: 1 }}
                  />

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddCountries}
                    disabled={selectedCountries.length === 0}
                    startIcon={<FiPlus />}
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: 600,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      height: "56px", // Match height of the Autocomplete
                    }}
                  >
                    Add
                  </Button>
                </Box>
              </Box>

              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  marginTop: 3,
                }}
              >
                <FiMapPin /> Current Restricted Countries:
              </Typography>

              {restrictedCountries.length === 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 3,
                    backgroundColor: (theme) => theme.palette.grey[50],
                    borderRadius: "8px",
                    border: "1px dashed",
                    borderColor: (theme) => theme.palette.grey[300],
                  }}
                >
                  <FiAlertCircle
                    style={{ marginRight: "8px", color: "#666" }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    No countries are currently restricted for this user.
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    maxHeight: "300px",
                    overflowY: "auto",
                    p: 2,
                    backgroundColor: (theme) => theme.palette.background.paper,
                    boxShadow: "inset 0 0 8px rgba(0,0,0,0.05)",
                  }}
                >
                  {Object.keys(restrictedByRegion)
                    .sort()
                    .map((region) => (
                      <Box key={region} mb={2}>
                        <Typography
                          variant="subtitle2"
                          color="primary"
                          gutterBottom
                          sx={{
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <FiGlobe style={{ marginRight: "8px" }} /> {region}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          {restrictedByRegion[region].sort().map((country) => (
                            <Chip
                              key={country}
                              label={country}
                              onDelete={() => handleDelete(country)}
                              color="primary"
                              variant="outlined"
                              size="medium"
                              deleteIcon={<FiX />}
                              sx={{
                                borderRadius: "16px",
                                fontWeight: 500,
                                "&:hover": {
                                  backgroundColor: (theme) =>
                                    theme.palette.primary.light + "20",
                                },
                              }}
                            />
                          ))}
                        </Box>
                        {region !==
                          Object.keys(restrictedByRegion)
                            .sort()
                            .slice(-1)[0] && <Divider sx={{ my: 1 }} />}
                      </Box>
                    ))}
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions
          sx={{ padding: "16px 24px", borderTop: "1px solid #e0e0e0" }}
        >
          <Button
            onClick={handleClose}
            color="primary"
            startIcon={<FiX />}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              borderRadius: "8px",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            disabled={loading}
            startIcon={loading ? null : <FiSave />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            {loading ? <CircularProgress size={24} /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserRestrictedCountries;
