"use client";
import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid2,
} from "@mui/material";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import { useSearchParams } from "next/navigation";
import { PaymentLevels, PaymentStatus } from "@/app/helpers/constants";
import Link from "next/link";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import ConfirmWithActionModel from "../../models/ConfirmsWithActionModel";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import SearchComponent from "../../formComponents/SearchComponent";

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
  {
    name: "paymentLevel",
    label: "Payment level",
    type: "enum",
    enum: PaymentLevels,
  },
  {
    name: "status",
    label: "Payment status",
    type: "enum",
    enum: PaymentStatus,
  },
];

const PaymentCalendar = () => {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const {
    data,
    loading,
    setData,
    page,
    setPage,
    limit,
    setLimit,
    total,
    setTotal,
    totalPages,
    setFilters,
  } = useDataFetcher(`accountant/payments?paymentId=${paymentId}&`, false, {
    status: "PENDING",
  });
  const [status, setStatus] = useState("PENDING");
  const [paymentLevel, setPaymentLevel] = useState("ALL");
  const { setLoading } = useToastContext();
  const handleResetFilter = () => {
    window.location.href = window.location.pathname;
  };
  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setFilters({ status: event.target.value });
  };
  const handlePaymentLevel = (event) => {
    setPaymentLevel(event.target.value);
    setFilters({ level: event.target.value });
  };

  function handleAfterEdit(newData) {
    const newPayments = data.map((payment) => {
      if (payment.id === newData.id) {
        payment.amountPaid = newData.amountPaid;
        payment.status = newData.status;
        payment.paymentLevel = newData.paymentLevel;
      }
      return payment;
    });
    setData(newPayments);
  }
  async function overDuePayment(id) {
    const request = await handleRequestSubmit(
      {},
      setLoading,
      `accountant/payments/overdue/${id}`,
      false,
      "Marking as over due"
    );
    if (request.status === 200) {
      const newPayments = data.map((payment) => {
        if (payment.id === id) {
          payment.status = "OVERDUE";
        }
        return payment;
      });
      setData(newPayments);
    }
  }
  return (
    <Container maxWidth="xxl" px={{ xs: 2, md: 4 }}>
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Button variant="outlined" onClick={handleResetFilter}>
          Reset filter
        </Button>
        <Grid2 spacing={2} container sx={{ flex: 1, maxWidth: "1200px" }}>
          <Grid2 size={4}>
            <SearchComponent
              apiEndpoint="search?model=client"
              setFilters={setFilters}
              inputLabel="Search client by name or phone"
              renderKeys={["name", "phone"]}
              mainKey="name"
              searchKey={"clientId"}
              withParamsChange={true}
            />
          </Grid2>
          <Grid2 size={4}>
            <FormControl fullWidth={true}>
              <InputLabel id="status">Status</InputLabel>
              <Select
                value={status}
                onChange={handleStatusChange}
                labelId="status"
                label="Status"
                displayEmpty
                inputProps={{ "aria-label": "Filter by status" }}
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="FULLY_PAID">Paid</MenuItem>
                <MenuItem value="OVERDUE">Over rude</MenuItem>
              </Select>
            </FormControl>
          </Grid2>
          <Grid2 size={4}>
            <FormControl fullWidth={true}>
              <InputLabel id="paymentLevel">Payment level</InputLabel>
              <Select
                value={paymentLevel}
                onChange={handlePaymentLevel}
                labelId="paymentLevel"
                label="Payment level"
                displayEmpty
                inputProps={{ "aria-label": "Filter by status" }}
              >
                <MenuItem value="ALL">All</MenuItem>
                {Object.keys(PaymentLevels).map((key) => (
                  <MenuItem key={key} value={key}>
                    {PaymentLevels[key]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid2>
        </Grid2>
      </Box>
      <AdminTable
        data={data}
        columns={columns}
        loading={loading}
        limit={limit}
        page={page}
        total={total}
        setPage={setPage}
        setLimit={setLimit}
        setTotal={setTotal}
        setData={setData}
        totalPages={totalPages}
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
              <ConfirmWithActionModel
                label="Mark as over due"
                title="Mark payment as over due"
                description="Are you sure you want to mark this payment as over due?"
                handleConfirm={() => overDuePayment(item.id)}
              />
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
