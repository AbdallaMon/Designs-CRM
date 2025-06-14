"use client";
import React from "react";
import { Box, Container } from "@mui/material";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import CreateModal from "../../models/CreateModal";
import { NotesComponent } from "../utility/Notes";

const renewInputs = [
  {
    data: {
      id: "startDate",
      label: "Start date",
      type: "date",
      defaultValue: new Date(),
    },
    useDefault: true,
    pattern: { required: { value: true, message: "Date is required" } },
  },
  {
    data: {
      id: "endDate",
      label: "End date",
      type: "date",
      defaultValue: new Date(),
    },
    useDefault: true,
    pattern: { required: { value: true, message: "Date is required" } },
  },
  {
    data: {
      id: "paymentDate",
      label: "Payment date",
      type: "date",
      defaultValue: new Date(),
    },
    useDefault: true,
    pattern: { required: { value: true, message: "Date is required" } },
  },
  {
    data: { id: "amount", label: "Amount", type: "number" },
    pattern: { required: { value: true, message: "Amount is required" } },
  },
];
const inputs = [
  {
    data: { id: "name", label: "Name of service", type: "text" },
    pattern: { required: { value: true, message: "Payment category" } },
  },
  {
    data: {
      id: "description",
      label: "Description",
      type: "textarea",
    },
  },
  ...renewInputs,
];

const columns = [
  { name: "name", label: "Name" },
  { name: "description", label: "Description" },
  { name: "rentPeriods.startDate", label: "Start date", type: "date" },
  { name: "rentPeriods.endDate", label: "End date", type: "date" },
  { name: "rentPeriods.amount", label: "Amount" },
];

const Rents = () => {
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
  } = useDataFetcher(`accountant/rents?`);
  function handleAfterEdit(newData) {
    // const newRents = data.map((item) => {
    //   if (item.id === newData.rentId) {
    //     item.rentPeriods = newData;
    //   }
    //   return item;
    // });
    // setData(newRents);
    window.location.reload();
  }
  return (
    <Container maxWidth="xxl" px={{ xs: 2, md: 4 }}>
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box sx={{ display: "flex", gap: 2 }}>
          <CreateModal
            href={"accountant/rents"}
            inputs={inputs}
            label={"Add rent"}
            setData={setData}
            setTotal={setTotal}
            extraProps={{
              formTitle: "New rent",
              btnText: "Add new rent",
              variant: "outlined",
            }}
          />
        </Box>
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
        editHref={`accountant/rents`}
        editFormButton={"Renew"}
        inputs={renewInputs}
        handleBeforeSubmit={(data, item) => {
          return { ...data, name: item.name };
        }}
        handleAfterEdit={handleAfterEdit}
        renderFormTitle={(item) => `Renew rent for ${item.name}`}
        editButtonText="Renew"
        extraComponent={({ item }) => (
          <>
            <Box sx={{ display: "flex", gap: 2 }}>
              <NotesComponent
                showAddNotes={true}
                idKey={"rentId"}
                id={item.id}
              />
            </Box>
          </>
        )}
      />
    </Container>
  );
};

export default Rents;
