"use client";
import React from "react";
import { Box, Container } from "@mui/material";
import AdminTable from "@/shared/components/AdminTable";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import CreateModal from "@/shared/components/models/CreateModal.jsx";
import { NotesComponent } from "@/shared/components/common/Notes.jsx";
import { renewInputs, inputs, columns } from "@/features/accountant/config/rentsConfig.js";

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
  } = useDataFetcher(`accounting/rents?`);
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
            href={"accounting/rents"}
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
        editHref={`accounting/rents`}
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
