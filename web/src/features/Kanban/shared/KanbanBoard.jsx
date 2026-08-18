"use client";
import { KANBAN_VIEW_TYPES } from "@dms/shared";
import React, { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Box, Grid, Button, Menu, MenuItem } from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import SearchComponent from "@/shared/components/formComponents/SearchComponent";
import DateRangeFilter from "@/shared/components/formComponents/DateRangeFilter";
import FilterSelect from "@/shared/components/formComponents/FilterSelect";
import TabsWithLinks from "@/shared/components/utility/TabsWithLinks";
import KanbanColumn from "@/features/Kanban/staff/KanbanColumn.jsx";
import { useAuth } from "@/app/providers/AuthProvider";
import { usePermission } from "@/app/hooks/usePermission";
import { LEAD_CODES } from "@/app/helpers/permissionCodes";
import { CONTRACT_LEVELS } from "@/app/helpers/constants";
import { FaEllipsisV } from "react-icons/fa";
import BulkConvertLeadsModal from "@/features/Kanban/shared/BulkConvertLeadsModal.jsx";
import KanbanFilterBar from "@/features/Kanban/shared/KanbanFilterBar.jsx";
import { getVisibleKanbanStatuses } from "@/features/Kanban/shared/kanban-board-filters.js";

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
  const visibleStatusArray = getVisibleKanbanStatuses({
    statusArray,
    selectedStatus:
      type === KANBAN_VIEW_TYPES.CONTRACT_LEVELS
        ? filters?.contractLevel
        : null,
  });
  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <Box px={1.5}>
          <KanbanFilterBar
            leadSearch={
              <SearchComponent
                resource="leads"
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
                withParamsChange={true}
                size="small"
              />
            }
            staffSearch={
              isAdminOrSuperSales ? (
                <SearchComponent
                  resource="users"
                  setFilters={setFilters}
                  inputLabel="Search staff by name or email"
                  renderKeys={["name", "email"]}
                  mainKey="name"
                  searchKey={"staffId"}
                  withParamsChange={true}
                  size="small"
                />
              ) : null
            }
            filters={
              !isNotStaff ? (
                <>
                  {type !== KANBAN_VIEW_TYPES.CONTRACT_LEVELS && (
                    <Box sx={{ width: { xs: "100%", md: "auto" }, flexShrink: 0 }}>
                      <DateRangeFilter
                        noMargin={true}
                        setFilters={setFilters}
                        lastThreeMonth={true}
                        startLabel="Created from"
                        endLabel="Created to"
                        size="small"
                        compact={true}
                      />
                    </Box>
                  )}
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
                      size="small"
                    />
                  </Box>
                  <Box sx={{ width: { xs: "100%", md: "auto" }, flexShrink: 0 }}>
                    <DateRangeFilter
                      noMargin={true}
                      setFilters={setFilters}
                      dateKey="finalizedRange"
                      startLabel="Finalized from"
                      endLabel="Finalized to"
                      withDeleteRange={true}
                      noDefaultValues={true}
                      size="small"
                      compact={true}
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
                  compact={true}
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
                    bottom: 24,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 1401,
                    px: 1,
                    py: 0.5,
                    borderRadius: "999px",
                    bgcolor: "background.paper",
                    boxShadow: "0 4px 16px rgba(42,34,26,0.18)",
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
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                    transformOrigin={{ vertical: "bottom", horizontal: "center" }}
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
                  <Button
                    variant="outlined"
                    size="small"
                    color="inherit"
                    onClick={() => setSelectedLeads([])}
                  >
                    Clear
                  </Button>
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
          {visibleStatusArray.map((status) => (
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
