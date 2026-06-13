"use client";
import React from "react";
import { Box, Button, Container } from "@mui/material";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import { PaymentLevels, PaymentStatus } from "@/app/helpers/constants";
import DateRangeFilter from "../../../formComponents/DateRangeFilter";
import Link from "next/link";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import SearchComponent from "../../../formComponents/SearchComponent";
import { PaymentHistoryModal } from "./PaymentsCalendar";
import CreateModal from "@/app/UiComponents/models/CreateModal";

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

const OverduePayments = () => {
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
  } = useDataFetcher(
    `accountant/payments?type=OVERDUE&status=OVERDUE&`,
    false,
    {
      status: "OVERDUE",
    }
  );

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

  return (
    <Container maxWidth="xxl" px={{ xs: 2, md: 4 }}>
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <SearchComponent
          apiEndpoint="search?model=client"
          setFilters={setFilters}
          inputLabel="Search client by name or phone"
          renderKeys={["name", "phone"]}
          mainKey="name"
          searchKey={"clientId"}
          withParamsChange={true}
        />
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
        inputs={inputs}
        extraComponent={({ item }) => (
          <>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Box>
                <CreateModal
                  label={"Pay"}
                  inputs={inputs}
                  href={`accountant/payments/pay/${item.id}`}
                  handleSubmit={(data) => {
                    handleAfterEdit(data);
                  }}
                  handleBeforeSubmit={async (data) => {
                    const formData = new FormData();
                    formData.append("file", data.file[0]);
                    const fileUpload = await handleRequestSubmit(
                      formData,
                      setLoading,
                      "utility/upload",
                      true,
                      "Uploading file"
                    );

                    data.file = fileUpload.fileUrls.file[0];
                    return data;
                  }}
                  setData={setData}
                  extraProps={{
                    formTitle: `Payment number # ${item.id}`,
                    btnText: "Pay",
                    variant: "outlined",
                  }}
                />
              </Box>
              <PaymentHistoryModal payment={item} />

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
