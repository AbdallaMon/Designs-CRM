"use client";
import React, { useState, useEffect } from "react";
import { Box, Button, Container } from "@mui/material";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getData } from "@/app/helpers/functions/getData";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import { useAuth } from "@/app/providers/AuthProvider";
import { useSearchParams } from "next/navigation";
import { PaymentStatus } from "@/app/helpers/constants";
import DateRangeFilter from "../../formComponents/DateRangeFilter";
import Link from "next/link";

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

const OverduePayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState();
  const fetchPayments = async (month, paymentId = null) => {
    let response;
    response = await getData({
      url: `accountant/payments?type=OVERDUE&status=OVERDUE&range=${
        filters?.range ? JSON.stringify(filters.range) : ""
      }&`,
      setLoading,
    });
    setPayments(response.data || []);
  };
  useEffect(() => {
    fetchPayments();
  }, [filters]);

  function handleAfterEdit(data) {
    const newPayments = payments.map((payment) => {
      if (payment.id === data.id) {
        payment.amountPaid = data.amountPaid;
        payment.status = data.status;
      }
      return payment;
    });
    setPayments(newPayments);
  }

  return (
    <Container maxWidth="xxl" px={{ xs: 2, md: 4 }}>
      <DateRangeFilter setFilters={setFilters} lastThreeMonth={true} />
      <AdminTable
        data={payments}
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

export default OverduePayments;
