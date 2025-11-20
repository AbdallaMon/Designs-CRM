"use client";
import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { MdClose } from "react-icons/md";
import { FinalSelectionForm } from "@/app/UiComponents/client-page/FinalSelectionForm";
import { designLead } from "@/app/UiComponents/client-page/clientPageData";
import { useAuth } from "@/app/providers/AuthProvider";
import { checkIfAdminOrSuperSales } from "@/app/helpers/functions/utility";
import LanguageProvider from "@/app/providers/LanguageProvider";

export default function CreateNewLead() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState("");
  const [selectedDesignLead, setSelectedDesignLead] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user } = useAuth();
  const isAdmin = checkIfAdminOrSuperSales(user);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    // Reset state when closing
    setStep(0);
    setLocation("");
    setSelectedDesignLead("");
  };

  const handleLocationChange = (event) => {
    setLocation(event.target.value);
  };

  const handleDesignLeadChange = (event) => {
    setSelectedDesignLead(event.target.value);
  };

  const handleContinue = () => {
    if (location && selectedDesignLead) {
      setStep(1);
    } else {
      // Show error or validation message
      alert("Please select both location and design type");
    }
  };

  if (!isAdmin) return;

  return (
    <LanguageProvider initialLng="en" dontChecklocalStorage={true}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        sx={{
          borderRadius: 2,
          padding: "12px 24px",
          fontSize: "1rem",
          fontWeight: 600,
          textTransform: "none",
        }}
      >
        Add new lead
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            zIndex: theme.zIndex.modal + 1,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: theme.palette.primary.main,
            color: "white",
            padding: 2,
          }}
        >
          {step === 0 ? "Request Design Service" : "Complete Your Request"}
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
          >
            <MdClose />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {step === 0 ? (
            <InitialSelection
              location={location}
              handleLocationChange={handleLocationChange}
              selectedDesignLead={selectedDesignLead}
              handleDesignLeadChange={handleDesignLeadChange}
              handleContinue={handleContinue}
              isMobile={isMobile}
            />
          ) : (
            <FinalSelectionForm
              category="DESIGN"
              item={selectedDesignLead}
              location={location}
              notClientPage={true}
              isAdmin={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </LanguageProvider>
  );
}

function InitialSelection({
  location,
  handleLocationChange,
  selectedDesignLead,
  handleDesignLeadChange,
  handleContinue,
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        backgroundColor: "#f8f9fa",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          padding: { xs: 2, md: 3 },
          borderRadius: 2,
          backgroundColor: "white",
          mb: 3,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            mb: 3,
            color: theme.palette.text.primary,
            fontWeight: 600,
          }}
        >
          Please select location and design type
        </Typography>

        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel id="location-label">Location</InputLabel>
            <Select
              labelId="location-label"
              id="location"
              value={location}
              label="Location"
              onChange={handleLocationChange}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="INSIDE_UAE">Inside UAE</MenuItem>
              <MenuItem value="OUTSIDE_UAE">Outside UAE</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="design-lead-label">Design Type</InputLabel>
            <Select
              labelId="design-lead-label"
              id="design-lead"
              value={selectedDesignLead}
              label="Design Type"
              onChange={handleDesignLeadChange}
              sx={{ borderRadius: 2 }}
            >
              {designLead.map((item) => (
                <MenuItem value={item.value} key={item.value}>
                  {item.value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="primary"
            onClick={handleContinue}
            fullWidth
            sx={{
              borderRadius: 2,
              padding: "12px",
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              mt: 2,
            }}
          >
            Continue
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
