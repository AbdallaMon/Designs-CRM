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
import { usePermission } from "@/app/hooks/usePermission";
import { LEAD_CODES } from "@/app/helpers/permissionCodes";
import { CONTRACT_LEVELS } from "@/app/helpers/constants";
import { FaEllipsisV } from "react-icons/fa";
import BulkConvertLeadsModal from "./BulkConvertLeadsModal";
import KanbanFilterBar from "./KanbanFilterBar";

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
  const { hasPermission } = usePermission();
  // lead.assign.other is granted to exactly ADMIN/SUPER_ADMIN + isSuperSales
  // (see permission-profiles-phase3-leads plan) — equivalent to checkIfAdminOrSuperSales
  // for base roles; also honors admin/super-admin subRoles (affordance-only, backend enforces).
  const isAdminOrSuperSales = hasPermission(LEAD_CODES.ASSIGN_OTHER);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [bulkConvertOpen, setBulkConvertOpen] = useState(false);
  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <Box px={1.5}>
          <KanbanFilterBar
            leadSearch={
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
            }
            staffSearch={
              isAdminOrSuperSales ? (
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
              ) : null
            }
            filters={
              !isNotStaff ? (
                <>
                  {type !== "CONTRACTLEVELS" && (
                    <>
                      <Box sx={{ width: { xs: "100%", md: "auto" }, flexShrink: 0 }}>
                        <DateRangeFilter
                          noMargin={true}
                          setFilters={setFilters}
                          lastThreeMonth={true}
                        />
                      </Box>
                      <Box sx={{ width: { xs: "100%", sm: 220 }, flexShrink: 0 }}>
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
                      </Box>
                    </>
                  )}
                  <Box sx={{ width: { xs: "100%", md: "auto" }, flexShrink: 0 }}>
                    <DateRangeFilter
                      noMargin={true}
                      setFilters={setFilters}
                      dateKey="finalizedRange"
                      startLabel="Finalized Start Range Date"
                      endLabel="Finalized End Range Date"
                      withDeleteRange={true}
                      noDefaultValues={true}
                    />
                  </Box>
                </>
              ) : null
            }
            links={
              links ? (
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
              ) : null
            }
            bulkActions={
              selectedLeads.length > 0 ? (
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
              ) : null
            }
          />
        </Box>
        <Grid
          container
          spacing={2}
          sx={{
            p: { xs: 1.5, md: 2 },
            mx: 1.5,
            mb: 2,
            background:
              "linear-gradient(160deg, #f4efe9 0%, #f8f5f1 60%, #f1ece6 100%)",
            borderRadius: "16px",
            flexWrap: "nowrap",
            alignItems: "flex-start",
            overflowX: "auto",
            "::-webkit-scrollbar": {
              height: "8px",
            },
            "::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "::-webkit-scrollbar-thumb": {
              background: "#d6cdc2",
              borderRadius: "4px",
            },
            "::-webkit-scrollbar-thumb:hover": {
              background: "#c4b8ab",
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
