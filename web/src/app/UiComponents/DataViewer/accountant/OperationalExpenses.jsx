"use client";
import React from "react";
import { Box, Container } from "@mui/material";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import CreateModal from "../../models/CreateModal";
import { NotesComponent } from "../utility/Notes";
import { inputs, columns } from "./config/expensesConfig";

const OperationalExpenses = () => {
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
  } = useDataFetcher(`accountant/operational-expenses?`);
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
            href={"accountant/operational-expenses"}
            inputs={inputs}
            label={"Add operational expense"}
            setData={setData}
            setTotal={setTotal}
            extraProps={{
              formTitle: "New operational expense",
              btnText: "Add new operational expense",
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
        extraComponent={({ item }) => (
          <>
            <Box sx={{ display: "flex", gap: 2 }}>
              <NotesComponent
                idKey={"operationalExpensesId"}
                id={item.id}
                showAddNotes={true}
              />
            </Box>
          </>
        )}
      />
    </Container>
  );
};

export default OperationalExpenses;
