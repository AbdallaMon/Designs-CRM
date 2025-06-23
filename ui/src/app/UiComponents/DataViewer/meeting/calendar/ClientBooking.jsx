import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  MdAccessTime,
  MdArrowBack,
  MdArrowForward,
  MdCheckCircle,
} from "react-icons/md";
import { Calendar } from "./CalendarTwo";
import { useState } from "react";

// Client Booking Component with Steps
const ClientBooking = ({ timezone: tz = "UTC" }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTimezone, setSelectedTimezone] = useState(tz);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const mockSlots = [
    {
      id: 1,
      startTime: "2025-06-25T09:00:00",
      endTime: "2025-06-25T10:00:00",
      isBooked: false,
    },
    {
      id: 2,
      startTime: "2025-06-25T10:15:00",
      endTime: "2025-06-25T11:15:00",
      isBooked: false,
    },
    {
      id: 3,
      startTime: "2025-06-25T11:30:00",
      endTime: "2025-06-25T12:30:00",
      isBooked: true,
    },
    {
      id: 4,
      startTime: "2025-06-25T14:00:00",
      endTime: "2025-06-25T15:00:00",
      isBooked: false,
    },
    {
      id: 5,
      startTime: "2025-06-25T15:15:00",
      endTime: "2025-06-25T16:15:00",
      isBooked: false,
    },
  ];

  const mockAvailableDays = [
    { date: new Date(Date.now() + 172800000).toISOString().split("T")[0] },
    { date: new Date(Date.now() + 432000000).toISOString().split("T")[0] },
    { date: new Date(Date.now() + 604800000).toISOString().split("T")[0] },
  ];

  const steps = ["Select Date", "Choose Time", "Enter Details", "Confirm"];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleDateSelect = (date) => {
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    setSelectedDate(parsedDate);
    setSelectedSlot(null);
    setAvailableSlots(mockSlots.filter((slot) => !slot.isBooked));
    handleNext();
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    handleNext();
  };

  const handleBooking = () => {
    if (selectedSlot && clientEmail && clientName) {
      alert(
        `Booking confirmed for ${clientName} at ${new Date(
          selectedSlot.startTime
        ).toLocaleDateString()} ${new Date(
          selectedSlot.startTime
        ).toLocaleTimeString()} (${selectedTimezone})`
      );
      // Reset form
      setActiveStep(0);
      setSelectedDate(null);
      setSelectedSlot(null);
      setClientEmail("");
      setClientName("");
    }
  };

  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "UTC",
  ];

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Box mb={2}>
              <FormControl fullWidth>
                <InputLabel>Your Timezone</InputLabel>
                <Select
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                  label="Your Timezone"
                  size={isMobile ? "small" : "medium"}
                >
                  {timezones.map((tz) => (
                    <MenuItem key={tz} value={tz}>
                      {tz} (
                      {new Date().toLocaleTimeString("en-US", {
                        timeZone: tz,
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                      )
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              availableDays={mockAvailableDays}
              timezone={selectedTimezone}
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Available Times for
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Timezone: {selectedTimezone}
            </Typography>
            <Stack spacing={1} mt={2}>
              {availableSlots.map((slot) => (
                <Button
                  key={slot.id}
                  variant={
                    selectedSlot?.id === slot.id ? "contained" : "outlined"
                  }
                  fullWidth
                  onClick={() => handleSlotSelect(slot)}
                  startIcon={<MdAccessTime />}
                  size={isMobile ? "medium" : "large"}
                  sx={{ justifyContent: "flex-start", p: 2 }}
                >
                  {new Date(slot.startTime).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}{" "}
                  -{" "}
                  {new Date(slot.endTime).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </Button>
              ))}
            </Stack>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Enter Your Details
            </Typography>
            <Stack spacing={2} mt={2}>
              <TextField
                fullWidth
                label="Full Name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                size={isMobile ? "small" : "medium"}
              />
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                required
                size={isMobile ? "small" : "medium"}
              />
            </Stack>
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirm Your Booking
            </Typography>
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="body1" gutterBottom>
                  <strong>Date:</strong>{" "}
                  {selectedDate?.format("dddd, MMMM D, YYYY")}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Time:</strong>{" "}
                  {selectedSlot &&
                    new Date(selectedSlot.startTime).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      }
                    )}{" "}
                  -{" "}
                  {selectedSlot &&
                    new Date(selectedSlot.endTime).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Timezone:</strong> {selectedTimezone}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Name:</strong> {clientName}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Email:</strong> {clientEmail}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom align="center">
        Book an Appointment
      </Typography>

      {isMobile ? (
        <Box>
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>
              Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
            </Typography>
            <Box
              sx={{
                width: "100%",
                height: 4,
                bgcolor: "grey.300",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${((activeStep + 1) / steps.length) * 100}%`,
                  height: "100%",
                  bgcolor: "primary.main",
                  transition: "width 0.3s ease",
                }}
              />
            </Box>
          </Box>

          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            {renderStepContent(activeStep)}
          </Paper>

          <Box display="flex" justifyContent="space-between" gap={2}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              variant="outlined"
              startIcon={<MdArrowBack />}
              fullWidth
            >
              Back
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button
                onClick={handleBooking}
                disabled={!clientEmail || !clientName}
                variant="contained"
                startIcon={<MdCheckCircle />}
                fullWidth
              >
                Confirm Booking
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={
                  (activeStep === 0 && !selectedDate) ||
                  (activeStep === 1 && !selectedSlot) ||
                  (activeStep === 2 && (!clientName || !clientEmail))
                }
                variant="contained"
                endIcon={<MdArrowForward />}
                fullWidth
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      ) : (
        <Box>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  <Box mb={2}>{renderStepContent(index)}</Box>
                  <Box display="flex" gap={1}>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      variant="outlined"
                    >
                      Back
                    </Button>
                    {index === steps.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={handleBooking}
                        disabled={!clientEmail || !clientName}
                        startIcon={<MdCheckCircle />}
                      >
                        Confirm Booking
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={
                          (index === 0 && !selectedDate) ||
                          (index === 1 && !selectedSlot) ||
                          (index === 2 && (!clientName || !clientEmail))
                        }
                      >
                        Continue
                      </Button>
                    )}
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {activeStep === steps.length && (
            <Paper square elevation={0} sx={{ p: 3 }}>
              <Typography>All steps completed - booking confirmed!</Typography>
              <Button onClick={() => setActiveStep(0)} sx={{ mt: 1, mr: 1 }}>
                Book Another Appointment
              </Button>
            </Paper>
          )}
        </Box>
      )}
    </Container>
  );
};

export default ClientBooking;
