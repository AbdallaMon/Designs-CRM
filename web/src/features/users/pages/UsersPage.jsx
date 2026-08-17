"use client";
import { useState } from "react";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import AdminTable from "@/shared/components/AdminTable";
import { Box, Container, lighten } from "@mui/material";

import SearchComponent from "@/shared/components/formComponents/SearchComponent.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.jsx";
import CreateModal from "@/shared/components/models/CreateModal.jsx";
import { columns, inputs, userColor } from "@/features/users/pages/users/config.jsx";
import UserRowActions from "@/features/users/pages/users/UserRowActions.jsx";
import UsersPageHeader from "@/features/users/pages/users/UsersPageHeader.jsx";
import UsersLegend from "@/features/users/pages/users/UsersLegend.jsx";
import { ProfileManagerDialog } from "@/features/users/ProfileManagerDialog.jsx";
import { mergeUserManagementRow } from "@/features/users/user-management-state.js";

export default function UsersPage() {
  // The user just created — assign their profiles right away (dialog auto-opens).
  const [newUser, setNewUser] = useState(null);
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
  } = useDataFetcher("users", false);
  const { setLoading } = useToastContext();

  async function banAUser(item) {
    const request = await handleRequestSubmit(
      { user: item },
      setLoading,
      `users/${item.id}/actions/change-status`,
      false,
      "Banning",
      null,
      "POST"
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
        editHref={"users"}
        mergeEditedItem={mergeUserManagementRow}
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
              resource="users"
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
              href={"users"}
              setData={setData}
              withClose={true}
              handleSubmit={(created) => {
                // Add the new user to the list, then immediately open the profiles
                // dialog so the admin assigns this user's profile(s) right away.
                if (created?.id) {
                  setData((prev) =>
                    Array.isArray(prev) ? [...prev, created] : [created]
                  );
                  setTotal((prev) => (prev || 0) + 1);
                  setNewUser(created);
                }
              }}
              extraProps={{
                formTitle: "New user",
                btnText: "Create",
              }}
            />
          </Box>
        </Box>
      </AdminTable>

      {newUser && (
        <ProfileManagerDialog
          key={newUser.id}
          userId={newUser.id}
          userProfiles={[]}
          currentProfileId={null}
          setData={setData}
          startOpen
          hideTrigger
          onClose={() => setNewUser(null)}
        />
      )}
    </div>
  );
}
