"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Container,
  Select,
  MenuItem,
} from "@mui/material";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getData } from "@/app/helpers/functions/getData";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import { useAuth } from "@/app/providers/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { PaymentStatus } from "@/app/helpers/constants";
import Link from "next/link";

const localizer = momentLocalizer(moment);

const inputs = [
  {
    data: { id: "amount", label: "Amount to be paid", type: "number" },
    pattern: { required: { value: true, message: "Amount is required" } },
  },
  {
    data: {
      id: "issuedDate",
      label: "Payment date",
      type: "date",
      defaultValue: new Date(),
    },
    useDefault: true,
    pattern: { required: { value: true, message: "Date is required" } },
  },
  {
    data: { id: "paymentId", key: "id", type: "number" },
    sx: { display: "none" },
  },
];

const columns = [
  { name: "id", label: "Payment number" },
  { name: "clientLead.client.name", label: "Client name" },
  { name: "clientLead.client.phone", label: "Client phone" },
  { name: "clientLead.description", label: "Description" },
  { name: "clientLead.averagePrice", label: "Price" },
  { name: "paymentReason", label: "Payment reason" },

  { name: "amount", label: "Amount" },
  { name: "amountPaid", label: "Amount paid" },

  { name: "dueDate", label: "Due date" },
  {
    name: "status",
    label: "Payment status",
    type: "enum",
    enum: PaymentStatus,
  },
];

const PaymentCalendar = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const router = useRouter();
  const [status, setStatus] = useState("ALL");
  const fetchPayments = async (month, paymentId = null) => {
    let response;
    if (paymentId) {
      response = await getData({
        url: `accountant/payments?paymentId=${paymentId}&`,
        setLoading,
      });
      const payment = response.data ? response.data[0] : null;

      if (payment) {
        const paymentMonth = moment(payment.dueDate);
        if (!currentMonth.isSame(paymentMonth, "month")) {
          setCurrentMonth(paymentMonth); // Set current month only if different
        }
        setFilteredPayments([payment]); // Filter by specific payment
      }
    } else {
      // Fetch all payments for the specified month
      response = await getData({
        url: `accountant/payments?month=${month.format(
          "YYYY-MM"
        )}&status=${status}&`,
        setLoading,
      });
      setPayments(response.data || []);
      setFilteredPayments(response.data || []);
    }
  };
  useEffect(() => {
    if (paymentId) {
      fetchPayments(currentMonth, paymentId);
    } else {
      fetchPayments(currentMonth);
    }
  }, [currentMonth, status, paymentId]);

  const handleResetFilter = () => {
    window.location.href = window.location.pathname;
  };
  const handleStatusChange = (event) => {
    setStatus(event.target.value);
  };
  const handleDateSelect = (slotInfo) => {
    const selectedDateString = moment(slotInfo.start).format("YYYY-MM-DD");
    const filtered = payments.filter(
      (payment) =>
        moment(payment.dueDate).format("YYYY-MM-DD") === selectedDateString
    );
    setFilteredPayments(filtered);
  };

  const handleNextMonth = () => {
    const nextMonth = currentMonth.clone().add(1, "month");
    setCurrentMonth(nextMonth);
  };

  const handlePrevMonth = () => {
    const prevMonth = currentMonth.clone().subtract(1, "month");
    setCurrentMonth(prevMonth);
  };

  const events = payments.map((payment) => ({
    title: `Amount: ${payment.amount}`,
    start: new Date(payment.dueDate),
    end: new Date(payment.dueDate),
    allDay: true,
  }));

  function handleAfterEdit(data) {
    const newPayments = filteredPayments.map((payment) => {
      if (payment.id === data.id) {
        payment.amountPaid = data.amountPaid;
        payment.status = data.status;
      }
      return payment;
    });
    setFilteredPayments(newPayments);
  }

  return (
    <Container maxWidth="xxl" px={{ xs: 2, md: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Button variant="contained" onClick={handlePrevMonth}>
          Prevouis month
        </Button>
        <Typography variant="h6">{currentMonth.format("MMMM YYYY")}</Typography>
        <Button variant="contained" onClick={handleNextMonth}>
          Next month
        </Button>
      </Box>
      <Box mb={3} sx={{ overflow: "auto" }}>
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={["month"]}
          date={currentMonth.toDate()} // Pass the current month to the calendar
          onNavigate={(date) => {
            const newMonth = moment(date);
            if (!currentMonth.isSame(newMonth, "month")) {
              setCurrentMonth(newMonth);
            }
          }}
          onSelectEvent={handleDateSelect}
          selectable
          style={{ height: 500, minWidth: 800 }}
          popup
          toolbar={false}
        />
      </Box>
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Button variant="outlined" onClick={handleResetFilter}>
          Reset filter
        </Button>
        <Select
          value={status}
          onChange={handleStatusChange}
          displayEmpty
          inputProps={{ "aria-label": "Filter by status" }}
        >
          <MenuItem value="ALL">All</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="FULLY_PAID">Paid</MenuItem>
          <MenuItem value="OVERDUE">Over rude</MenuItem>
        </Select>
      </Box>
      <AdminTable
        data={filteredPayments} // Use filtered payments based on selected date
        columns={columns}
        loading={loading}
        noPagination={true}
        withEdit={true}
        handleAfterEdit={(data) => handleAfterEdit(data)}
        editHref={"accountant/payments/pay"}
        editButtonText={"Pay"}
        renderFormTitle={(item) => `Payment number # ${item.id}`}
        inputs={inputs}
        editFormButton="Pay"
        extraComponent={({ item }) => (
          <>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                component={Link}
                href={"/dashboard/deals/" + item.clientLead.id}
              >
                View Details
              </Button>
            </Box>
          </>
        )}
      />
    </Container>
  );
};

export default PaymentCalendar;
