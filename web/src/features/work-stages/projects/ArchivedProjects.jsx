"use client";

import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import { useAuth } from "@/app/providers/AuthProvider";
import PaginationWithLimit from "@/shared/components/PaginationWithLimit";
import LeadProjects from "@/features/work-stages/projects/LeadProjects";
import SearchComponent from "@/shared/components/formComponents/SearchComponent";
import { Box, Container } from "@mui/material";

export default function ArchivedProjects() {
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
  } = useDataFetcher("projects/archived", false);
  const { user } = useAuth();
  return (
    <Container maxWidth="lg">
      <SearchComponent
        resource="leads"
        setFilters={setFilters}
        inputLabel="Search lead by id ,name or phone"
        renderKeys={["id", "client.name", "client.phone", "client.email"]}
        mainKey="id"
        searchKey={"id"}
        withParamsChange={true}
      />
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
