"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import {Box, Button} from "@mui/material";

import React from "react";
import {useAuth} from "@/app/providers/AuthProvider.jsx";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent.jsx";
import {handleRequestSubmit} from "@/app/helpers/functions/handleSubmit.js";
import {useToastContext} from "@/app/providers/ToastLoadingProvider.js";
import ConfirmWithActionModel from "@/app/UiComponents/models/ConfirmsWithActionModel.jsx";
import Link from "next/link";
import CreateModal from "@/app/UiComponents/models/CreateModal.jsx";

const columns = [
    {name: "name", label: "User Name"},
    {name: "email", label: "Email"},
    {
        name: "isActive", label: "حالة الحساب", type: "boolean", enum: {TRUE: "Active", FALSE: "Banned"}
    }
];
const inputs = [
    {
        data: { id: "name", type: "text", label: "User name", key: "name" },
        pattern: {
            required: {
                value: true,
                message: "Please enter a name",
            },
        },
    },
    {
        data: { id: "email", type: "email", label: "Email" },
        pattern: {
            required: {
                value: true,
                message: "Please enter an email address",
            },
            pattern: {
                value: /\w+@[a-z]+\.[a-z]{2,}/gi,
                message: "Please enter a valid email address",
            },
        },
    },
    {
        data: {
            id: "password",
            type: "password",
            label: "Password",
            helperText: "The password must contain an uppercase letter, a lowercase letter, a number, and be at least 8 characters long"
        },
        pattern: {
            required: {
                value: true,
                message: "Please enter a password",
            },
            pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
                message:
                      "The password must contain an uppercase letter, a lowercase letter, a number, and be at least 8 characters long",
            },
        },
    },
];


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
        setTotal, totalPages, setFilters
    } = useDataFetcher("admin/users" , false);
    const {setLoading}=useToastContext()
    async function banAStudent(item) {
        const request = await handleRequestSubmit({user: item}, setLoading, `admin/users/${item.id}`, false, "Banning", null, "PATCH")

        return request;
    }
    const editInputs = [...inputs]
    editInputs.map((input) => {
              if (input.data.id === "password") {
                  input.pattern = {}
              }
              return input;
          }
    );
    return (
          <div>

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
                    editHref={"admin/users"}
                    extraComponent={({item}) => (
      <>
            <Box sx={{display: "flex", gap: 2}}>
          <Button component={Link} href={"/dashboard/users/"+item.id}>
              View Details
          </Button>
                <ConfirmWithActionModel
                      title={item.isActive ? "Are you sure you want to ban this user?" : "Are you sure you want to unban this user?"}
                      handleConfirm={() => banAStudent(item)}
                      isDelete={item.isActive}
                      label={item.isActive ? "Ban User" : "Unban User"}
                />
            </Box>
      </>
                    )}
              >
                  <Box display="flex" width="100%" gap={2} flexWrap="wrap" alignItems="center"
                       justifyContent="space-between"
                       flexDirection={{xs: "column-reverse", md: "row"}}
                  >
                      <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" flex={1}>
                          <Box sx={{width: {xs: "100%", md: "fit-content"}}}>
                              <SearchComponent
                                    apiEndpoint="search?model=user"
                                    setFilters={setFilters}
                                    inputLabel="Search by name or email"
                                    renderKeys={["name", "email"]}
                                    mainKey="name"
                                    searchKey={"userId"}
                                    withParamsChange={true}
                              />
                          </Box>
                          <div>
                              <CreateModal
                                    label={"Create new user"}
                                    inputs={editInputs}
                                    href={"admin/users"}
                                    setData={setData}
                                    extraProps={{formTitle: "New user", btnText: "Create", variant: "outlined"}}
                              />
                          </div>
                      </Box>
                  </Box>
              </AdminTable>

          </div>
);
}
