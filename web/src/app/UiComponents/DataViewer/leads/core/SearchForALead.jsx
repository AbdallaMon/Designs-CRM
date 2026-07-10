"use client";
import { Box, Typography, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay";
import { LeadCard } from "./LeadCard";

/* ----------------------------------------------------------------------------
 * Preserved (not in the page flow anymore): the admin lead-lookup card. Kept
 * exported so no external reuse site breaks; the page now routes admin lookups
 * into PreviewDialog instead. Body identical to the previous implementation.
 * -------------------------------------------------------------------------- */
export function SearchForALead() {
  const [lead, setLead] = useState();
  const [loading, setLoading] = useState();
  const [filters, setFilters] = useState();
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  const theme = useTheme();
  async function getALead() {
    await getDataAndSet({
      url: `shared/client-leads/${filters.id}`,
      setLoading,
      setData: setLead,
    });
  }
  useEffect(() => {
    if (filters && filters?.id) {
      getALead();
    }
  }, [filters, filters?.id]);
  if (!isAdmin) return;
  return (
    <Box
      sx={{
        width: "100%",
        margin: "auto",
        py: 1,
        pb: 3,
        background: theme.palette.background.default,
        position: "relative",
        mb: 10,
        borderRadius: 3,
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      {loading && <LoadingOverlay />}
      <Typography variant="h5" sx={{ pl: 2, mb: 0.5 }}>
        Search in deals
      </Typography>
      <SearchComponent
        apiEndpoint="search?model=clientLead"
        setFilters={setFilters}
        inputLabel="Search lead by id ,name or phone"
        renderKeys={["id", "client.name", "client.phone", "client.email"]}
        mainKey="id"
        searchKey={"id"}
        withParamsChange={false}
      />
      {lead && <LeadCard lead={lead} />}
    </Box>
  );
}
