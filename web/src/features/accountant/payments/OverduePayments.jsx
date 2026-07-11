"use client";
import React from "react";
import { Box, Button, Container } from "@mui/material";
import AdminTable from "@/shared/components/AdminTable";
import DateRangeFilter from "@/shared/components/formComponents/DateRangeFilter.jsx";
import Link from "next/link";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import SearchComponent from "@/shared/components/formComponents/SearchComponent.jsx";
import { PaymentHistoryModal } from "@/features/accountant/payments/PaymentsCalendar.jsx";
import CreateModal from "@/shared/components/models/CreateModal";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { inputs, columns } from "@/features/accountant/config/overduePaymentsConfig.js";

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
  const { setLoading } = useToastContext();

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
                      "files/single",
                      true,
                      "Uploading file"
                    );

                    data.file = fileUpload.data?.url;
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
