"use client";

import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import PaginationWithLimit from "@/app/UiComponents/DataViewer/PaginationWithLimit";
import LeadProjects from "@/app/UiComponents/DataViewer/work-stages/projects/LeadProjects";
import { Box, Container } from "@mui/material";

export default function Projects() {
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
  } = useDataFetcher("admin/projects", false);
  return (
    <Container maxWidth="lg">
      {data?.map((lead) => {
        return (
          <Box key={lead.id} my={2}>
            <LeadProjects
              clientLeadId={lead.id}
              initialProjects={lead.groupedProjects}
              noIntialLoad={true}
            />
          </Box>
        );
      })}
      <PaginationWithLimit
        limit={limit}
        page={page}
        setLimit={setLimit}
        setPage={setPage}
        total={total}
        totalPages={totalPages}
      />
    </Container>
  );
}
