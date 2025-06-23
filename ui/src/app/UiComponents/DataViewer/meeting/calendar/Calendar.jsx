"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";

import dayjs from "dayjs";
import {
  MdAdminPanelSettings,
  MdCalendarToday,
  MdMore,
  MdPerson,
} from "react-icons/md";

const CalendarBookingSystem = () => {
  const [currentUser, setCurrentUser] = useState({
    id: 1,
    name: "John Doe",
    role: "client", // "admin" or "client"
    email: "john@example.com",
  });

  const [anchorEl, setAnchorEl] = useState(null);

  // Mock data - in real app, this would come from your backend
  const [availableDays, setAvailableDays] = useState([
    {
      id: 1,
      date: dayjs().add(1, "day").startOf("day").toISOString(),
      userId: 1,
      slots: [
        {
          id: 1,
          startTime: dayjs().add(1, "day").hour(9).minute(0).toISOString(),
          endTime: dayjs().add(1, "day").hour(10).minute(0).toISOString(),
          isBooked: false,
          availableDayId: 1,
        },
        {
          id: 2,
          startTime: dayjs().add(1, "day").hour(10).minute(15).toISOString(),
          endTime: dayjs().add(1, "day").hour(11).minute(15).toISOString(),
          isBooked: true,
          availableDayId: 1,
        },
        {
          id: 3,
          startTime: dayjs().add(1, "day").hour(14).minute(0).toISOString(),
          endTime: dayjs().add(1, "day").hour(15).minute(0).toISOString(),
          isBooked: false,
          availableDayId: 1,
        },
      ],
    },
  ]);

  const [bookings, setBookings] = useState([
    {
      id: 1,
      clientName: "Alice Smith",
      clientEmail: "alice@example.com",
      clientPhone: "+1234567890",
      reason: "Consultation meeting",
      slotId: 2,
      status: "CONFIRMED",
      createdAt: dayjs().subtract(1, "hour").toISOString(),
    },
  ]);

  const handleUserRoleToggle = () => {
    setCurrentUser((prev) => ({
      ...prev,
      role: prev.role === "admin" ? "client" : "admin",
    }));
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <AppBar
        position="static"
        elevation={0}
        sx={{ backgroundColor: "white", borderBottom: "1px solid #e2e8f0" }}
      >
        <Toolbar>
          <Box
            sx={{ display: "flex", alignItems: "center", flexGrow: 1, gap: 2 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: "8px",
                backgroundColor: "#3b82f6",
                color: "white",
              }}
            >
              <MdCalendarToday />
            </Box>
            <Typography variant="h6" sx={{ color: "#1e293b", fontWeight: 600 }}>
              BookingPro
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Chip
              icon={
                currentUser.role === "admin" ? (
                  <MdAdminPanelSettings />
                ) : (
                  <MdPerson />
                )
              }
              label={`${currentUser.name} (${currentUser.role})`}
              color={currentUser.role === "admin" ? "primary" : "secondary"}
              variant="outlined"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={currentUser.role === "admin"}
                  onChange={handleUserRoleToggle}
                  color="primary"
                />
              }
              label="Admin Mode"
              sx={{ color: "#64748b" }}
            />

            <IconButton onClick={handleMenuOpen} sx={{ color: "#64748b" }}>
              <MdMore />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
              <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
              <MenuItem onClick={handleMenuClose}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {currentUser.role === "admin" ? (
          <AdminDashboard
            availableDays={availableDays}
            setAvailableDays={setAvailableDays}
            bookings={bookings}
            setBookings={setBookings}
            currentUser={currentUser}
          />
        ) : (
          <ClientBookingView
            availableDays={availableDays}
            bookings={bookings}
            setBookings={setBookings}
            currentUser={currentUser}
          />
        )}
      </Container>
    </Box>
  );
};

// Client Booking View Component
const ClientBookingView = ({
  availableDays,
  bookings,
  setBookings,
  currentUser,
}) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [step, setStep] = useState(1); // 1: Select Date, 2: Select Time, 3: Book Appointment

  const [clientInfo, setClientInfo] = useState({
    name: currentUser.name || "",
    email: currentUser.email || "",
    phone: "",
    reason: "",
  });

  // Get available dates for current month
  const getAvailableDates = () => {
    return availableDays.filter((day) => {
      const dayDate = dayjs(day.date);
      return (
        dayDate.month() === currentMonth.month() &&
        dayDate.year() === currentMonth.year() &&
        day.slots.some((slot) => !slot.isBooked) &&
        dayDate.isAfter(dayjs().subtract(1, "day"))
      );
    });
  };

  // Get available slots for selected date
  const getAvailableSlots = () => {
    if (!selectedDate) return [];

    const day = availableDays.find((d) =>
      dayjs(d.date).isSame(selectedDate, "day")
    );
    return day ? day.slots.filter((slot) => !slot.isBooked) : [];
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep(2);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const handleBookingSubmit = () => {
    const newBooking = {
      id: Date.now(),
      clientName: clientInfo.name,
      clientEmail: clientInfo.email,
      clientPhone: clientInfo.phone,
      reason: clientInfo.reason,
      slotId: selectedSlot.id,
      status: "CONFIRMED",
      createdAt: dayjs().toISOString(),
    };

    setBookings((prev) => [...prev, newBooking]);

    // Here you would also update the slot to be booked
    // This would be handled by your backend API

    // Reset form
    setStep(1);
    setSelectedDate(null);
    setSelectedSlot(null);
    setClientInfo((prev) => ({ ...prev, reason: "", phone: "" }));

    alert("Booking confirmed successfully!");
  };

  const handleBackStep = () => {
    if (step === 2) {
      setStep(1);
      setSelectedDate(null);
    } else if (step === 3) {
      setStep(2);
      setSelectedSlot(null);
    }
  };

  return (
    <Box>
      {/* Progress Indicator */}
      <Paper
        elevation={0}
        sx={{ p: 3, mb: 3, backgroundColor: "white", borderRadius: 2 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          {[1, 2, 3].map((stepNum) => (
            <React.Fragment key={stepNum}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: step >= stepNum ? "#3b82f6" : "#e2e8f0",
                  color: step >= stepNum ? "white" : "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                {stepNum}
              </Box>
              {stepNum < 3 && (
                <Box
                  sx={{
                    width: 40,
                    height: 2,
                    backgroundColor: step > stepNum ? "#3b82f6" : "#e2e8f0",
                    borderRadius: 1,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </Box>

        <Typography variant="h6" sx={{ color: "#1e293b", fontWeight: 600 }}>
          {step === 1 && "Select a Date"}
          {step === 2 && "Select a Time"}
          {step === 3 && "Enter Your Details"}
        </Typography>

        {step > 1 && (
          <Typography
            variant="body2"
            sx={{ color: "#3b82f6", cursor: "pointer", mt: 1 }}
            onClick={handleBackStep}
          >
            ← Back
          </Typography>
        )}
      </Paper>

      {/* Step Content */}
      {step === 1 && (
        <ClientDateSelector
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          availableDates={getAvailableDates()}
          onDateSelect={handleDateSelect}
        />
      )}

      {step === 2 && (
        <ClientTimeSelector
          selectedDate={selectedDate}
          availableSlots={getAvailableSlots()}
          onSlotSelect={handleSlotSelect}
        />
      )}

      {step === 3 && (
        <ClientBookingForm
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          clientInfo={clientInfo}
          setClientInfo={setClientInfo}
          onSubmit={handleBookingSubmit}
        />
      )}
    </Box>
  );
};

// Client Date Selector Component
const ClientDateSelector = ({
  currentMonth,
  setCurrentMonth,
  availableDates,
  onDateSelect,
}) => {
  const generateCalendarDays = () => {
    const startOfMonth = currentMonth.startOf("month");
    const endOfMonth = currentMonth.endOf("month");
    const startDate = startOfMonth.startOf("week");
    const endDate = endOfMonth.endOf("week");

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = day.add(1, "day");
    }

    return days;
  };

  const isDateAvailable = (date) => {
    return availableDates.some((d) => dayjs(d.date).isSame(date, "day"));
  };

  const calendarDays = generateCalendarDays();

  return (
    <Paper
      elevation={0}
      sx={{ p: 3, backgroundColor: "white", borderRadius: 2 }}
    >
      {/* Month Navigation */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <IconButton
          onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
          sx={{ color: "#64748b" }}
        >
          ←
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b" }}>
          {currentMonth.format("MMMM YYYY")}
        </Typography>
        <IconButton
          onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
          sx={{ color: "#64748b" }}
        >
          →
        </IconButton>
      </Box>

      {/* Calendar Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 1,
          mb: 2,
        }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <Typography
            key={day}
            variant="caption"
            sx={{
              textAlign: "center",
              fontWeight: 600,
              color: "#64748b",
              py: 1,
            }}
          >
            {day}
          </Typography>
        ))}
      </Box>

      <Box
        sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}
      >
        {calendarDays.map((date, index) => {
          const isCurrentMonth = date.month() === currentMonth.month();
          const isToday = date.isSame(dayjs(), "day");
          const isAvailable = isDateAvailable(date);
          const isPast = date.isBefore(dayjs(), "day");

          return (
            <Box
              key={index}
              onClick={() => isAvailable && onDateSelect(date)}
              sx={{
                minHeight: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isAvailable ? "pointer" : "default",
                borderRadius: 1,
                backgroundColor: isToday
                  ? "#3b82f6"
                  : isAvailable
                  ? "#f0f9ff"
                  : "transparent",
                color: isToday
                  ? "white"
                  : isAvailable
                  ? "#3b82f6"
                  : isPast
                  ? "#cbd5e1"
                  : "#64748b",
                opacity: isCurrentMonth ? 1 : 0.3,
                fontWeight: isAvailable ? 600 : 400,
                border: isAvailable
                  ? "1px solid #3b82f6"
                  : "1px solid transparent",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: isAvailable ? "#dbeafe" : undefined,
                  transform: isAvailable ? "scale(1.05)" : undefined,
                },
              }}
            >
              {date.date()}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

// Client Time Selector Component
const ClientTimeSelector = ({ selectedDate, availableSlots, onSlotSelect }) => {
  return (
    <Paper
      elevation={0}
      sx={{ p: 3, backgroundColor: "white", borderRadius: 2 }}
    >
      <Typography
        variant="h6"
        sx={{ mb: 3, fontWeight: 600, color: "#1e293b" }}
      >
        Available times for {selectedDate?.format("dddd, MMMM D, YYYY")}
      </Typography>

      {availableSlots.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body1" sx={{ color: "#64748b" }}>
            No available time slots for this date.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 2,
          }}
        >
          {availableSlots.map((slot) => (
            <Box
              key={slot.id}
              onClick={() => onSlotSelect(slot)}
              sx={{
                p: 2,
                border: "1px solid #e2e8f0",
                borderRadius: 2,
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "#3b82f6",
                  backgroundColor: "#f0f9ff",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, color: "#1e293b" }}
              >
                {dayjs(slot.startTime).format("h:mm A")}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                {dayjs(slot.endTime).diff(dayjs(slot.startTime), "minute")}{" "}
                minutes
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

// Client Booking Form Component
const ClientBookingForm = ({
  selectedDate,
  selectedSlot,
  clientInfo,
  setClientInfo,
  onSubmit,
}) => {
  const handleInputChange = (field) => (event) => {
    setClientInfo((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const isFormValid = clientInfo.name && clientInfo.email && clientInfo.phone;

  return (
    <Paper
      elevation={0}
      sx={{ p: 3, backgroundColor: "white", borderRadius: 2 }}
    >
      <Box
        sx={{
          mb: 3,
          p: 2,
          backgroundColor: "#f0f9ff",
          borderRadius: 1,
          border: "1px solid #3b82f6",
        }}
      >
        <Typography variant="body2" sx={{ color: "#1e293b", fontWeight: 600 }}>
          Selected Appointment
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          {selectedDate?.format("dddd, MMMM D, YYYY")} at{" "}
          {dayjs(selectedSlot?.startTime).format("h:mm A")}
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gap: 3 }}>
        <Box>
          <Typography
            variant="body2"
            sx={{ mb: 1, fontWeight: 600, color: "#1e293b" }}
          >
            Full Name *
          </Typography>
          <input
            type="text"
            value={clientInfo.name}
            onChange={handleInputChange("name")}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </Box>

        <Box>
          <Typography
            variant="body2"
            sx={{ mb: 1, fontWeight: 600, color: "#1e293b" }}
          >
            Email Address *
          </Typography>
          <input
            type="email"
            value={clientInfo.email}
            onChange={handleInputChange("email")}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </Box>

        <Box>
          <Typography
            variant="body2"
            sx={{ mb: 1, fontWeight: 600, color: "#1e293b" }}
          >
            Phone Number *
          </Typography>
          <input
            type="tel"
            value={clientInfo.phone}
            onChange={handleInputChange("phone")}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </Box>

        <Box>
          <Typography
            variant="body2"
            sx={{ mb: 1, fontWeight: 600, color: "#1e293b" }}
          >
            Reason for Meeting (Optional)
          </Typography>
          <textarea
            value={clientInfo.reason}
            onChange={handleInputChange("reason")}
            rows={3}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              fontSize: "14px",
              outline: "none",
              resize: "vertical",
              fontFamily: "inherit",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </Box>

        <Box
          onClick={isFormValid ? onSubmit : undefined}
          sx={{
            mt: 2,
            p: 2,
            backgroundColor: isFormValid ? "#3b82f6" : "#e2e8f0",
            color: isFormValid ? "white" : "#94a3b8",
            borderRadius: 2,
            textAlign: "center",
            cursor: isFormValid ? "pointer" : "not-allowed",
            fontWeight: 600,
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: isFormValid ? "#2563eb" : "#e2e8f0",
              transform: isFormValid ? "translateY(-1px)" : undefined,
            },
          }}
        >
          Schedule Meeting
        </Box>
      </Box>
    </Paper>
  );
};

// Admin Dashboard Component (simplified for now)
const AdminDashboard = ({
  availableDays,
  setAvailableDays,
  bookings,
  setBookings,
  currentUser,
}) => {
  return (
    <Box>
      <Paper
        elevation={0}
        sx={{ p: 3, backgroundColor: "white", borderRadius: 2 }}
      >
        <Typography
          variant="h5"
          sx={{ mb: 2, fontWeight: 600, color: "#1e293b" }}
        >
          Admin Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748b" }}>
          Admin functionality will be implemented here. This includes:
        </Typography>
        <Box component="ul" sx={{ mt: 2, color: "#64748b" }}>
          <li>Manage available days and time slots</li>
          <li>Set working hours and break times</li>
          <li>View and manage bookings</li>
          <li>Add/remove availability</li>
        </Box>
      </Paper>
    </Box>
  );
};

export default CalendarBookingSystem;
