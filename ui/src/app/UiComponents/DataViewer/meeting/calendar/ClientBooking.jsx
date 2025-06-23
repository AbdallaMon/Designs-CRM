"use client";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  Paper,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
  Autocomplete,
  Fade,
  Avatar,
  Divider,
} from "@mui/material";
import {
  MdAccessTime,
  MdArrowBack,
  MdArrowForward,
  MdCalendarToday,
  MdCheckCircle,
  MdEmail,
  MdLocationOn,
  MdPerson,
  MdSchedule,
} from "react-icons/md";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { Calendar } from "./Calendar";
import { getData } from "@/app/helpers/functions/getData";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
// Client Booking Component with Steps
const ClientBooking = ({ timezone: tz = "Asia/Dubai" }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTimezone, setSelectedTimezone] = useState(tz);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [dayId, setDayId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const getSlotsData = async () => {
    const slotsReq = await getData({
      url: `client/calendar/slots/${dayId}`,
      setLoading,
    });
    if (slotsReq.status === 200) {
      setSlots(slotsReq.data);
    } else {
      setSlots([]);
    }
  };
  useEffect(() => {
    if (dayId) {
      getSlotsData();
    }
  }, [dayId]);

  const steps = ["Select Date", "Choose Time", "Enter Details", "Confirm"];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleDateSelect = (date, day) => {
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    setSelectedDate(parsedDate);
    setSelectedSlot(null);
    setDayId(day ? day.id : null);
    setAvailableSlots(slots.filter((slot) => !slot.isBooked));
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

  const groupedTimezoneOptions = Intl.supportedValuesOf("timeZone")
    .map((tz) => {
      const [region = "Other", city = ""] = tz.split("/");
      const label = tz.replace("_", " ");
      const currentTime = new Date().toLocaleTimeString("en-US", {
        timeZone: tz,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      return {
        group: region,
        label: `${label} (${currentTime})`,
        value: tz,
      };
    })
    .sort(
      (a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label)
    );

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Box mb={2}>
              <Typography
                variant="h6"
                gutterBottom
                color="primary"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <MdLocationOn />
                Change Your Timezone
              </Typography>
              <FormControl fullWidth>
                <Autocomplete
                  options={groupedTimezoneOptions}
                  groupBy={(option) => option.group}
                  getOptionLabel={(option) => option.label}
                  value={
                    groupedTimezoneOptions.find(
                      (opt) => opt.value === selectedTimezone
                    ) || null
                  }
                  onChange={(e, newValue) =>
                    setSelectedTimezone(newValue?.value || "")
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select your timezone"
                      size="medium"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        },
                      }}
                    />
                  )}
                  fullWidth
                  disableClearable
                />
              </FormControl>
            </Box>
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              timezone={selectedTimezone}
            />
          </Box>
        );
      case 1:
        return (
          <Fade in timeout={500}>
            <Box position="relative">
              {loading && <LoadingOverlay />}
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
                      timeZone: selectedTimezone,
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}{" "}
                    -{" "}
                    {new Date(slot.endTime).toLocaleTimeString("en-US", {
                      timeZone: selectedTimezone,
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </Button>
                ))}
              </Stack>
            </Box>
          </Fade>
        );
      case 2:
        return (
          <Fade in timeout={500}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Tell us about yourself
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                gutterBottom
                mb={3}
              >
                We&#39;ll use this information to send you booking confirmations
              </Typography>

              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <MdPerson
                        style={{
                          marginRight: 8,
                          color: theme.palette.text.secondary,
                        }}
                      />
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <MdEmail
                        style={{
                          marginRight: 8,
                          color: theme.palette.text.secondary,
                        }}
                      />
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </Stack>
            </Box>
          </Fade>
        );
      case 3:
        return (
          <Box>
            <Fade in timeout={500}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Confirm Your Booking
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                  mb={3}
                >
                  Please review your booking details below
                </Typography>

                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    border: "2px solid",
                    borderColor: "primary.main",
                    bgcolor: "primary.50",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          <MdCalendarToday />
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Date
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            <strong>Time:</strong>{" "}
                            {selectedSlot &&
                              new Date(
                                selectedSlot.startTime
                              ).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}{" "}
                            -{" "}
                            {selectedSlot &&
                              new Date(selectedSlot.endTime).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider />

                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          <MdSchedule />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" gutterBottom>
                            <strong>Date:</strong>{" "}
                            {selectedDate?.format("dddd, MMMM D, YYYY")}
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            <strong>Time:</strong>{" "}
                            {selectedSlot &&
                              new Date(
                                selectedSlot.startTime
                              ).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}{" "}
                            -{" "}
                            {selectedSlot &&
                              new Date(selectedSlot.endTime).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedTimezone}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider />

                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          <MdPerson />
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Contact
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {clientName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {clientEmail}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </Fade>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ px: { xs: 1 } }}>
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
          {activeStep === 0 && <>{renderStepContent(activeStep)}</>}
          {activeStep !== 0 && (
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
              {renderStepContent(activeStep)}
            </Paper>
          )}
          <Box display="flex" justifyContent="space-between" gap={2} mt={1.5}>
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
