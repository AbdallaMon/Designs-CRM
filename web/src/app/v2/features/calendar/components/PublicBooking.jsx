"use client";

// PUBLIC client booking wizard — UNGATED, the per-meeting `token` (query param) IS the auth.
// Behavior + appearance PRESERVED from the legacy ClientBooking.jsx — data access repointed
// through calendarService.* (apiFetch.public, token-based, NO session).
//
// §5c / contract note (IMPORTANT): the /book request body sends ONLY
//   { selectedSlot, selectedTimezone }
// The legacy code POSTed the WHOLE sessionData (token, dayId, selectedDate, …) — the v2 BE
// uses a .strict() schema and derives reminderId/clientLeadId/adminId from the verified token,
// so it 422s on extra keys. We therefore pass only the two whitelisted fields.

import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Fade,
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
} from "@mui/material";
import {
  MdAccessTime,
  MdArrowBack,
  MdArrowForward,
  MdCalendarToday,
  MdCheckCircle,
  MdError,
  MdLocationOn,
  MdRefresh,
  MdSchedule,
} from "react-icons/md";
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

import LoadingOverlay from "@/app/v2/shared/components/feedback/LoadingOverlay";
import AvailabilityCalendar from "./AvailabilityCalendar.jsx";
import { calendarService } from "../calendar.service.js";
import { runCalendarMutation } from "../calendar.mutations.js";
import { BOOKING_STEPS, resolveBrowserTimezone } from "../config/calendarConstants.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.locale("en");

export function PublicBooking() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [activeStep, setActiveStep] = useState(0);
  const [availableSlots, setAvailableSlots] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(false);
  const [groupedTimezoneOptions, setGroupedTimezoneOptions] = useState([]);
  const [loadingTimezone, setLoadingTimezone] = useState(false);
  const tz = resolveBrowserTimezone();
  const [error, setError] = useState(null);
  const [loadingSlotSelect, setLoadingSlotSelect] = useState(false);
  const [sessionData, setSessionData] = useState({
    selectedDate: null,
    selectedSlot: null,
    selectedTimezone: tz,
    dayId: null,
    token,
  });

  const getSlotsData = async () => {
    if (!sessionData.selectedDate) return;
    const dateParam = dayjs(sessionData.selectedDate).format("YYYY-MM-DD");
    try {
      setLoading(true);
      const res = await calendarService.getClientSlots({
        token,
        date: dateParam,
        timezone: sessionData.selectedTimezone,
      });
      setAvailableSlots(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const getTimezoneOptions = async () => {
    try {
      setLoadingTimezone(true);
      const res = await calendarService.getTimezones();
      setGroupedTimezoneOptions(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setGroupedTimezoneOptions([]);
    } finally {
      setLoadingTimezone(false);
    }
  };

  useEffect(() => {
    if (sessionData.selectedDate) getSlotsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData.selectedDate, sessionData.selectedTimezone]);

  useEffect(() => {
    getTimezoneOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    if (activeStep === 0 && sessionData.selectedDate) getSlotsData();
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (activeStep === 1) {
      setAvailableSlots([]);
      setSessionData((prev) => ({ ...prev, selectedSlot: null, selectedDate: null }));
    }
    if (activeStep === 2 && sessionData.selectedDate) getSlotsData();
    setActiveStep((prev) => prev - 1);
  };

  const handleDateSelect = (date, day) => {
    handleNext();
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    setSessionData((prev) => ({
      ...prev,
      selectedDate: parsedDate,
      dayId: day ? day.id : null,
      selectedSlot: null,
    }));
  };

  const handleSlotSelect = async (slot) => {
    handleNext();
    try {
      setLoadingSlotSelect(true);
      const res = await calendarService.getClientSlotDetails({
        token,
        slotId: slot.id,
        timezone: sessionData.selectedTimezone,
      });
      setSessionData((prev) => ({ ...prev, selectedSlot: res?.data }));
    } catch (e) {
      setError(
        e?.data?.message || e?.message || "تعذر جلب تفاصيل الموعد. حاول مرة أخرى.",
      );
      setSessionData((prev) => ({ ...prev, selectedSlot: null, selectedDate: null }));
      setActiveStep(0);
    } finally {
      setLoadingSlotSelect(false);
    }
  };

  const handleBooking = async () => {
    if (!sessionData.selectedSlot) return;
    // §5c: send ONLY { selectedSlot, selectedTimezone } — token in the query, the BE derives
    // reminderId/clientLeadId/adminId from the verified token. NO reminderId/clientLeadId/dayId.
    const res = await runCalendarMutation(
      () =>
        calendarService.book({
          token,
          timezone: sessionData.selectedTimezone,
          selectedSlot: sessionData.selectedSlot,
          selectedTimezone: sessionData.selectedTimezone,
        }),
      { loading: "جاري الحجز..." },
    );
    if (res) setActiveStep((prev) => prev + 1);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Box mb={2}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <MdLocationOn /> غيّر منطقتك الزمنية
              </Typography>
              <FormControl fullWidth>
                <Autocomplete
                  options={groupedTimezoneOptions}
                  groupBy={(option) => option.group}
                  getOptionLabel={(option) => option.label}
                  loading={loadingTimezone}
                  value={groupedTimezoneOptions.find((opt) => opt.value === sessionData.selectedTimezone) || null}
                  onChange={(_e, newValue) =>
                    setSessionData((prev) => ({ ...prev, selectedTimezone: newValue?.value || "" }))
                  }
                  renderInput={(params) => (
                    <TextField {...params} placeholder="اختر منطقتك الزمنية" size="medium" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                  )}
                  fullWidth
                  disableClearable
                />
              </FormControl>
            </Box>
            <AvailabilityCalendar
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
              {loading && <LoadingOverlay isLoading />}
              <Typography variant="h6" gutterBottom>
                المواعيد المتاحة
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                المنطقة الزمنية: {sessionData.selectedTimezone}
              </Typography>
              <Stack spacing={1} mt={2}>
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant={sessionData?.selectedSlot?.id === slot.id ? "contained" : "outlined"}
                    fullWidth
                    onClick={() => handleSlotSelect(slot)}
                    startIcon={<MdAccessTime />}
                    size={isMobile ? "medium" : "large"}
                    sx={{ justifyContent: "flex-start", p: 2 }}
                  >
                    {dayjs(slot.startTime).tz(sessionData.selectedTimezone).format("h:mm A")} -{" "}
                    {dayjs(slot.endTime).tz(sessionData.selectedTimezone).format("h:mm A")}
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
                تأكيد الحجز
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom mb={3}>
                يرجى مراجعة تفاصيل الحجز أدناه
              </Typography>
              <Card variant="outlined" sx={{ borderRadius: 3, border: "2px solid", borderColor: "primary.main", bgcolor: "primary.50", position: "relative" }}>
                <CardContent sx={{ p: 3 }}>
                  {loadingSlotSelect && <LoadingOverlay isLoading />}
                  <Stack spacing={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        <MdCalendarToday />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" gutterBottom>
                          <strong>التاريخ:</strong>{" "}
                          {sessionData.selectedSlot &&
                            dayjs(sessionData.selectedSlot.startTime)?.tz(sessionData.selectedTimezone).format("dddd, MMMM D, YYYY")}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          <strong>الوقت:</strong>{" "}
                          {sessionData.selectedSlot &&
                            `${dayjs(sessionData.selectedSlot.startTime).tz(sessionData.selectedTimezone).format("h:mm A")} - ${dayjs(
                              sessionData.selectedSlot.endTime,
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
        );
      case 3:
        return (
          <Fade in timeout={500}>
            <Box textAlign="center">
              <Box mb={3}>
                <Avatar sx={{ bgcolor: "success.main", width: 80, height: 80, mx: "auto", mb: 2 }}>
                  <MdCheckCircle size={40} />
                </Avatar>
                <Typography variant="h5" gutterBottom color="success.main">
                  تم تأكيد الحجز! 🎉
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={3}>
                  شكراً لحجزك معنا. تم جدولة موعدك بنجاح.
                </Typography>
              </Box>
              <Card variant="outlined" sx={{ borderRadius: 3, border: "2px solid", borderColor: "success.main", bgcolor: "success.50", mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom color="success.dark">
                    تفاصيل الموعد
                  </Typography>
                  <Stack spacing={2} alignItems="center">
                    <Box display="flex" alignItems="center" gap={2}>
                      <MdSchedule color="success.main" />
                      <Box textAlign="left">
                        <Typography variant="body1">
                          <strong>التاريخ:</strong>{" "}
                          {sessionData.selectedSlot &&
                            dayjs(sessionData.selectedSlot.startTime).tz(sessionData.selectedTimezone).format("dddd, MMMM D, YYYY")}
                        </Typography>
                        <Typography variant="body1">
                          <strong>الوقت:</strong>{" "}
                          {sessionData.selectedSlot
                            ? `${dayjs(sessionData.selectedSlot.startTime).tz(sessionData.selectedTimezone).format("h:mm A")} - ${dayjs(
                                sessionData.selectedSlot.endTime,
                              )
                                .tz(sessionData.selectedTimezone)
                                .format("h:mm A")}`
                            : sessionData.time
                              ? `${dayjs(sessionData.time).tz(sessionData.selectedTimezone).format("h:mm A")} `
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
              <Box sx={{ bgcolor: "grey.50", p: 3, borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  📧 تم إرسال بريد تأكيد.
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  📅 يرجى إضافة هذا الموعد إلى تقويمك
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ❓ إذا احتجت لإعادة الجدولة أو الإلغاء، يرجى التواصل معنا
                </Typography>
              </Box>
            </Box>
          </Fade>
        );
      default:
        return null;
    }
  };

  if (error) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
        <Container maxWidth="sm">
          <Paper elevation={8} sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px solid", borderColor: "error.light" }}>
            <Avatar sx={{ bgcolor: "error.light", width: 80, height: 80, mx: "auto", mb: 3 }}>
              <MdError size={40} color="white" />
            </Avatar>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              حدث خطأ ما
            </Typography>
            <Alert severity="error" sx={{ mb: 4, textAlign: "left" }}>
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
                onClick={() => window.location.reload()}
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                تحديث الصفحة
              </Button>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3, fontStyle: "italic" }}>
              إذا استمرت المشكلة، يرجى التواصل مع الدعم أو المحاولة لاحقاً.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ px: { xs: 1 }, py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        احجز موعداً
      </Typography>

      {isMobile ? (
        <Box>
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>
              الخطوة {activeStep + 1} من {BOOKING_STEPS.length}: {BOOKING_STEPS[activeStep]}
            </Typography>
            <Box sx={{ width: "100%", height: 4, bgcolor: "grey.300", borderRadius: 2, overflow: "hidden" }}>
              <Box
                sx={{
                  width: `${((activeStep + 1) / BOOKING_STEPS.length) * 100}%`,
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
          {activeStep !== BOOKING_STEPS.length - 1 && (
            <Box display="flex" justifyContent="space-between" gap={2} mt={1.5}>
              <Button onClick={handleBack} disabled={activeStep === 0} variant="outlined" startIcon={<MdArrowBack />} fullWidth>
                السابق
              </Button>
              {activeStep === BOOKING_STEPS.length - 2 ? (
                <Button onClick={handleBooking} variant="contained" startIcon={<MdCheckCircle />} fullWidth>
                  تأكيد الحجز
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={(activeStep === 0 && !sessionData.selectedDate) || (activeStep === 1 && !sessionData.selectedSlot)}
                  variant="contained"
                  endIcon={<MdArrowForward />}
                  fullWidth
                >
                  التالي
                </Button>
              )}
            </Box>
          )}
        </Box>
      ) : (
        <Box>
          <Stepper activeStep={activeStep} orientation="vertical">
            {BOOKING_STEPS.map((label, index) => (
              <Step key={label}>
                {activeStep !== BOOKING_STEPS.length - 1 && <StepLabel>{label}</StepLabel>}
                <StepContent>
                  <Box mb={2}>{renderStepContent(index)}</Box>
                  {activeStep !== BOOKING_STEPS.length - 1 && (
                    <Box display="flex" gap={1}>
                      <Button disabled={index === 0} onClick={handleBack} variant="outlined">
                        السابق
                      </Button>
                      {index === BOOKING_STEPS.length - 2 ? (
                        <Button variant="contained" onClick={handleBooking} startIcon={<MdCheckCircle />}>
                          تأكيد الحجز
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          disabled={(index === 0 && !sessionData.selectedDate) || (index === 1 && !sessionData.selectedSlot)}
                        >
                          متابعة
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
}

export default PublicBooking;
