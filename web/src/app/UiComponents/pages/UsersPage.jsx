"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import { Box, Container, lighten } from "@mui/material";

import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import CreateModal from "@/app/UiComponents/models/CreateModal.jsx";
import { columns, inputs, userColor } from "@/app/UiComponents/pages/users/config.jsx";
import UserRowActions from "@/app/UiComponents/pages/users/UserRowActions.jsx";
import UsersPageHeader from "@/app/UiComponents/pages/users/UsersPageHeader.jsx";
import UsersLegend from "@/app/UiComponents/pages/users/UsersLegend.jsx";

export default function UsersPage() {
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
  } = useDataFetcher("admin/users", false);
  const { setLoading } = useToastContext();

  async function banAUser(item) {
    const request = await handleRequestSubmit(
      { user: item },
      setLoading,
      `admin/users/${item.id}`,
      false,
      "Banning",
      null,
      "PATCH"
    );
    if (request.status === 200) {
      setData((oldData) =>
        oldData.map((lead) => {
          if (lead.id === item.id) {
            return { ...lead, isActive: !lead.isActive };
          }
          return lead;
        })
      );
    }

    return request;
  }

  const editInputs = [...inputs];
  editInputs.map((input) => {
    if (input.data.id === "password") {
      input.pattern = {};
    }
    return input;
  });
  return (
    <div>
      <Container maxWidth="xl" sx={{ pt: { xs: 3, md: 4 } }}>
        <UsersPageHeader />
        <UsersLegend />
      </Container>
      <AdminTable
        data={data}
        columns={columns}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        total={total}
        setTotal={setTotal}
        totalPages={totalPages}
        setData={setData}
        inputs={inputs}
        loading={loading}
        withEdit={true}
        rowSx={(user) => ({
          backgroundColor: lighten(userColor(user), 0.95),
        })}
        editHref={"admin/users"}
        extraComponent={({ item }) => (
          <UserRowActions item={item} setData={setData} banAUser={banAUser} />
        )}
      >
        <Box
          display="flex"
          width="100%"
          gap={2}
          flexWrap="wrap"
          alignItems="center"
          justifyContent="space-between"
          flexDirection={{ xs: "column-reverse", md: "row" }}
        >
          <Box
            sx={{
              width: { xs: "100%", md: 340 },
              maxWidth: "100%",
            }}
          >
            <SearchComponent
              apiEndpoint="search?model=all-users"
              setFilters={setFilters}
              inputLabel="Search by name or email"
              renderKeys={["name", "email"]}
              mainKey="name"
              searchKey={"userId"}
              withParamsChange={true}
            />
          </Box>
          <Box sx={{ width: { xs: "100%", md: "auto" } }}>
            <CreateModal
              label={"Create new user"}
              inputs={editInputs}
              href={"admin/users"}
              setData={setData}
              extraProps={{
                formTitle: "New user",
                btnText: "Create",
                variant: "contained",
              }}
            />
          </Box>
        </Box>
      </AdminTable>
    </div>
  );
}
