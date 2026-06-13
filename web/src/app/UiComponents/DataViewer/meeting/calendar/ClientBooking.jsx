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
  Alert,
} from "@mui/material";
import {
  MdAccessTime,
  MdArrowBack,
  MdArrowForward,
  MdCalendarToday,
  MdCheckCircle,
  MdEmail,
  MdError,
  MdLocationOn,
  MdPerson,
  MdRefresh,
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
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useSearchParams } from "next/navigation";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale("en");

// Client Booking Component with Steps
const ClientBooking = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [activeStep, setActiveStep] = useState(0);
  const [availableSlots, setAvailableSlots] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(false);
  const [groupedTimezoneOptions, setGroupedTimezoneOptions] = useState([]);
  const [loadingTimezone, setLoadingTimezone] = useState(false);
  const { setLoading: setToastLoading } = useToastContext();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Dubai";
  const { setAlertError } = useAlertContext();
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState({
    selectedDate: null,
    selectedSlot: null,
    selectedTimezone: tz,
    dayId: null,
    token,
  });
  console.log(sessionData, "sessionData");
  const [loadingSlotSelect, setLoadingSlotSelect] = useState(false);

  // 🔁 Get slots for selected date (same structure as admin/staff)
  const getSlotsData = async () => {
    if (!sessionData.selectedDate) return;

    const dateParam = dayjs(sessionData.selectedDate).format("YYYY-MM-DD");
    const slotsReq = await getData({
      url: `client/calendar/slots?date=${dateParam}&token=${token}&timezone=${
        sessionData.selectedTimezone
      }&isMobile=${isMobile ? 1 : 0}&`,
      setLoading,
    });

    if (slotsReq.status === 200) {
      // same structure as admin / staff
      setAvailableSlots(slotsReq.data || []);
    } else {
      setAvailableSlots([]);
    }
  };

  const getTimezoneOptions = async () => {
    const timeZoneReq = await getData({
      url: `client/calendar/timezones`,
      setLoading: setLoadingTimezone,
    });
    if (timeZoneReq.status === 200) {
      setGroupedTimezoneOptions(timeZoneReq.data);
    }
  };

  // 🔁 Refetch slots when date or timezone changes
  useEffect(() => {
    if (sessionData && sessionData.selectedDate) {
      getSlotsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData.selectedDate, sessionData.selectedTimezone]);

  useEffect(() => {
    getTimezoneOptions();
  }, []);

  const steps = ["Select Date", "Choose Time", "Confirm", "Success"];

  const handleNext = () => {
    if (activeStep === 0 && sessionData.selectedDate) {
      getSlotsData();
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    if (activeStep === 1) {
      setAvailableSlots([]);
      setSessionData((prev) => ({
        ...prev,
        selectedSlot: null,
        selectedDate: null,
      }));
    }
    if (activeStep === 2 && sessionData.selectedDate) {
      getSlotsData();
    }
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleDateSelect = (date, day) => {
    // date is a dayjs object from Calendar
    handleNext();
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    setSessionData((prev) => ({
      ...prev,
      selectedDate: parsedDate,
      dayId: day ? day.id : null, // still stored if backend needs it, but slots are by date now
      selectedSlot: null,
    }));
  };

  const handleSlotSelect = async (slot) => {
    const req = await getData({
      url: `client/calendar/slots/details?slotId=${slot.id}&token=${token}&timezone=${sessionData.selectedTimezone}&`,
      setLoading: setLoadingSlotSelect,
    });
    handleNext();
    if (req.status === 200) {
      setSessionData((prev) => ({
        ...prev,
        selectedSlot: req.data,
      }));
      // handleNext();
    } else {
      setAlertError(
        req?.error ||
          req?.message ||
          "Failed to fetch slot details. Please try again."
      );
      setSessionData((prev) => ({
        ...prev,
        selectedSlot: null,
        selectedDate: null,
      }));
      setActiveStep(0);
    }
  };

  const handleBooking = async () => {
    if (sessionData.selectedSlot) {
      const bookingReq = await handleRequestSubmit(
        sessionData,
        setToastLoading,
        `client/calendar/book?token=${token}&&timezone=${sessionData.selectedTimezone}&`,
        false,
        "Booking..."
      );
      if (bookingReq.status === 200) {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      }
    }
  };

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
                  loading={loadingTimezone}
                  value={
                    groupedTimezoneOptions.find(
                      (opt) => opt.value === sessionData.selectedTimezone
                    ) || null
                  }
                  onChange={(e, newValue) => {
                    console.log(newValue, "newValue");
                    setSessionData((prev) => ({
                      ...prev,
                      selectedTimezone: newValue?.value || "",
                    }));
                  }}
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
              selectedDate={sessionData.selectedDate}
              onDateSelect={handleDateSelect}
              timezone={sessionData.selectedTimezone || tz}
              token={token}
              setSessionData={setSessionData}
              setError={setError}
              setActiveStep={setActiveStep}
              type="CLIENT"
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
                Timezone: {sessionData.selectedTimezone}
              </Typography>

              <Stack spacing={1} mt={2}>
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant={
                      sessionData?.selectedSlot?.id === slot.id
                        ? "contained"
                        : "outlined"
                    }
                    fullWidth
                    onClick={() => handleSlotSelect(slot)}
                    startIcon={<MdAccessTime />}
                    size={isMobile ? "medium" : "large"}
                    sx={{ justifyContent: "flex-start", p: 2 }}
                  >
                    {dayjs(slot.startTime)
                      .tz(sessionData.selectedTimezone)
                      .format("h:mm A")}{" "}
                    -{" "}
                    {dayjs(slot.endTime)
                      .tz(sessionData.selectedTimezone)
                      .format("h:mm A")}
                  </Button>
                ))}
              </Stack>
            </Box>
          </Fade>
        );
      case 2:
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
                    position: "relative",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {loadingSlotSelect && <LoadingOverlay />}
                    <Stack spacing={2}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          <MdCalendarToday />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" gutterBottom>
                            <strong>Date:</strong>{" "}
                            {sessionData.selectedSlot &&
                              dayjs(sessionData.selectedSlot.startTime)
                                ?.tz(sessionData.selectedTimezone)
                                .format("dddd, MMMM D, YYYY")}
                          </Typography>

                          <Typography variant="body1" gutterBottom>
                            <strong>Time:</strong>{" "}
                            {sessionData.selectedSlot &&
                              `${dayjs(sessionData.selectedSlot.startTime)
                                .tz(sessionData.selectedTimezone)
                                .format("h:mm A")} - ${dayjs(
                                sessionData.selectedSlot.endTime
                              )
                                .tz(sessionData.selectedTimezone)
                                .format("h:mm A")}`}
                          </Typography>

                          <Typography variant="caption" color="text.secondary">
                            {sessionData.selectedTimezone}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider />
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </Fade>
          </Box>
        );
      case 3:
        return (
          <Fade in timeout={500}>
            <Box textAlign="center">
              <Box mb={3}>
                <Avatar
                  sx={{
                    bgcolor: "success.main",
                    width: 80,
                    height: 80,
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  <MdCheckCircle size={40} />
                </Avatar>

                <Typography variant="h5" gutterBottom color="success.main">
                  Booking Confirmed! 🎉
                </Typography>

                <Typography variant="body1" color="text.secondary" mb={3}>
                  Thank you for booking with us. Your appointment has been
                  successfully scheduled.
                </Typography>
              </Box>

              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  border: "2px solid",
                  borderColor: "success.main",
                  bgcolor: "success.50",
                  mb: 3,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom color="success.dark">
                    Meeting Details
                  </Typography>

                  <Stack spacing={2} alignItems="center">
                    <Box display="flex" alignItems="center" gap={2}>
                      <MdSchedule color="success.main" />
                      <Box textAlign="left">
                        <Typography variant="body1">
                          <strong>Date:</strong>{" "}
                          {sessionData.selectedSlot &&
                            dayjs(sessionData.selectedSlot.startTime)
                              .tz(sessionData.selectedTimezone)
                              .format("dddd, MMMM D, YYYY")}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Time:</strong>{" "}
                          {sessionData.selectedSlot
                            ? `${dayjs(sessionData.selectedSlot.startTime)
                                .tz(sessionData.selectedTimezone)
                                .format("h:mm A")} - ${dayjs(
                                sessionData.selectedSlot.endTime
                              )
                                .tz(sessionData.selectedTimezone)
                                .format("h:mm A")}`
                            : sessionData.time
                            ? `${dayjs(sessionData.time)
                                .tz(sessionData.selectedTimezone)
                                .format("h:mm A")} `
                            : ""}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({sessionData.selectedTimezone})
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Box
                sx={{
                  bgcolor: "grey.50",
                  p: 3,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "grey.200",
                }}
              >
                <Typography variant="body2" color="text.secondary" mb={2}>
                  📧 A confirmation email has been sent.
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  📅 Please add this meeting to your calendar
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ❓ If you need to reschedule or cancel, please contact us
                </Typography>
              </Box>
            </Box>
          </Fade>
        );
      default:
        return null;
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={8}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "error.light",
            }}
          >
            <Avatar
              sx={{
                bgcolor: "error.light",
                width: 80,
                height: 80,
                mx: "auto",
                mb: 3,
              }}
            >
              <MdError size={40} color="white" />
            </Avatar>

            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              fontWeight="bold"
            >
              Oops! Something went wrong
            </Typography>

            <Alert
              severity="error"
              sx={{
                mb: 4,
                textAlign: "left",
                "& .MuiAlert-message": {
                  width: "100%",
                },
              }}
            >
              <Typography variant="body1" fontWeight="medium">
                {error}
              </Typography>
            </Alert>

            <Stack spacing={2}>
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<MdRefresh />}
                onClick={handleRefresh}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1.1rem",
                }}
              >
                Refresh Page
              </Button>
            </Stack>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 3, fontStyle: "italic" }}
            >
              If the problem persists, please contact support or try again
              later.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

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
          {activeStep !== steps.length - 1 && (
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

              {activeStep === steps.length - 2 ? (
                <Button
                  onClick={handleBooking}
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
                    (activeStep === 0 && !sessionData.selectedDate) ||
                    (activeStep === 1 && !sessionData.selectedSlot)
                  }
                  variant="contained"
                  endIcon={<MdArrowForward />}
                  fullWidth
                >
                  Next
                </Button>
              )}
            </Box>
          )}
        </Box>
      ) : (
        <Box>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                {activeStep !== steps.length - 1 && (
                  <StepLabel>{label}</StepLabel>
                )}
                <StepContent>
                  <Box mb={2}>{renderStepContent(index)}</Box>
                  {activeStep !== steps.length - 1 && (
                    <Box display="flex" gap={1}>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        variant="outlined"
                      >
                        Back
                      </Button>
                      {index === steps.length - 2 ? (
                        <Button
                          variant="contained"
                          onClick={handleBooking}
                          startIcon={<MdCheckCircle />}
                        >
                          Confirm Booking
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          disabled={
                            (index === 0 && !sessionData.selectedDate) ||
                            (index === 1 && !sessionData.selectedSlot)
                          }
                        >
                          Continue
                        </Button>
                      )}
                    </Box>
                  )}
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Box>
      )}
    </Container>
  );
};

export default ClientBooking;
