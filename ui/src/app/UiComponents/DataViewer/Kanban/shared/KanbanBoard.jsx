"use client";
import React, { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Box, Grid, Button, Menu, MenuItem } from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent";
import DateRangeFilter from "@/app/UiComponents/formComponents/DateRangeFilter";
import FilterSelect from "@/app/UiComponents/formComponents/FilterSelect";
import TabsWithLinks from "@/app/UiComponents/utility/TabsWithLinks";
import KanbanColumn from "../staff/KanbanColumn";
import { useAuth } from "@/app/providers/AuthProvider";
import { CONTRACT_LEVELS } from "@/app/helpers/constants";
import { checkIfAdminOrSuperSales } from "@/app/helpers/functions/utility";
import { FaEllipsisV } from "react-icons/fa";
import BulkConvertLeadsModal from "./BulkConvertLeadsModal";

dayjs.extend(relativeTime);

const KanbanBoard = ({
  links,
  statusArray,
  setFilters,
  type,
  reRenderColumns,
  setReRenderColumns,
  staffId,
  filters,
  isNotStaff,
}) => {
  const { user } = useAuth();
  const isAdminOrSuperSales = checkIfAdminOrSuperSales(user);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [bulkConvertOpen, setBulkConvertOpen] = useState(false);
  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <Box px={1.5}>
          <Box
            sx={{
              display: "flex",
              width: "100%",
              p: { xs: 1.5, md: 3 },
              mb: 2,
              backgroundColor: "background.paper",
              borderRadius: 1,
              boxShadow: 1,
              gap: 1,
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: {
                xs: "column",
                md: "row",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                alignItems: "center",
                width: {
                  xs: "100%",
                  md: "auto",
                },
              }}
            >
              <SearchComponent
                apiEndpoint="search?model=clientLead"
                setFilters={setFilters}
                inputLabel="Search lead by id ,code ,name or phone"
                renderKeys={[
                  "id",
                  "code",
                  "client.name",
                  "client.phone",
                  "client.email",
                ]}
                mainKey="id"
                searchKey={"id"}
                localFilters={{ staffId: user.id, userRole: user.role }}
                withParamsChange={true}
              />
              {isAdminOrSuperSales && (
                <SearchComponent
                  apiEndpoint={`search?model=${
                    type && type !== "CONTRACTLEVELS" ? type : "STAFF"
                  }`}
                  setFilters={setFilters}
                  inputLabel="Search staff by name or email"
                  renderKeys={["name", "email"]}
                  mainKey="name"
                  searchKey={"staffId"}
                  withParamsChange={true}
                />
              )}{" "}
              {!isNotStaff && (
                <>
                  {type !== "CONTRACTLEVELS" && (
                    <>
                      <DateRangeFilter
                        noMargin={true}
                        setFilters={setFilters}
                        lastThreeMonth={true}
                      />
                      <FilterSelect
                        options={Object.entries(CONTRACT_LEVELS).map(
                          ([key, value]) => {
                            return {
                              id: key,
                              name: value,
                            };
                          }
                        )}
                        label={"Contract Level"}
                        loading={false}
                        param={"contractLevel"}
                        setFilters={setFilters}
                      />
                    </>
                  )}
                  <DateRangeFilter
                    noMargin={true}
                    setFilters={setFilters}
                    dateKey="finalizedRange"
                    startLabel="Finalized Start Range Date"
                    endLabel="Finalized End Range Date"
                    withDeleteRange={true}
                    noDefaultValues={true}
                  />
                </>
              )}
            </Box>
            {links && (
              <Box
                display="flex"
                justifyContent="flex-end"
                sx={{
                  width: {
                    xs: "100%",
                    md: "auto",
                  },
                }}
              >
                <TabsWithLinks
                  links={links}
                  sx={{
                    "& .MuiTabs-flexContainer": {
                      justifyContent: {
                        xs: "center",
                        md: "flex-end",
                      },
                    },
                  }}
                />
              </Box>
            )}
            {selectedLeads.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  position: "fixed",
                  bottom: 30,
                  right: 50,
                  zIndex: 1000,
                }}
              >
                <Button
                  variant="contained"
                  size="small"
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  endIcon={<FaEllipsisV />}
                >
                  Actions ({selectedLeads.length})
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                >
                  <MenuItem
                    onClick={() => {
                      setBulkConvertOpen(true);
                      setAnchorEl(null);
                    }}
                  >
                    Convert Leads
                  </MenuItem>
                </Menu>
              </Box>
            )}
          </Box>
        </Box>
        <Grid
          container
          spacing={2}
          sx={{
            p: 3,
            bgcolor: "grey.100",
            flexWrap: "noWrap",
            overflowX: "auto",
            "::-webkit-scrollbar": {
              height: "6px",
            },
            "::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "4px",
            },
            "::-webkit-scrollbar-thumb": {
              background: "#bbb",
              borderRadius: "4px",
            },
            "::-webkit-scrollbar-thumb:hover": {
              background: "#999",
            },
          }}
        >
          {statusArray.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              statusArray={statusArray}
              reRenderColumns={reRenderColumns}
              setRerenderColumns={setReRenderColumns}
              staffId={staffId}
              filters={filters}
              setFilters={setFilters}
              type={type}
              isNotStaff={isNotStaff}
              isAdminOrSuperSales={isAdminOrSuperSales}
              selectedLeads={selectedLeads}
              setSelectedLeads={setSelectedLeads}
            />
          ))}
        </Grid>
        {bulkConvertOpen && (
          <BulkConvertLeadsModal
            leads={selectedLeads}
            open={bulkConvertOpen}
            onClose={() => setBulkConvertOpen(false)}
            onSuccess={() => {
              setSelectedLeads([]);
              setReRenderColumns((prev) =>
                Object.fromEntries(
                  statusArray.map((status) => [status, !prev[status]])
                )
              );
            }}
          />
        )}
      </DndProvider>
    </>
  );
};

export default KanbanBoard;
