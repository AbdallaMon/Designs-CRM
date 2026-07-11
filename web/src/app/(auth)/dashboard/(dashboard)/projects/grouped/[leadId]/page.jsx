import LeadProjects from "@/features/work-stages/projects/LeadProjects";
import { Container } from "@mui/material";

export default async function GroupedProjects({ params }) {
  const { leadId } = await params;
  return (
    <Container maxWidth="md">
      <LeadProjects clientLeadId={leadId} />
    </Container>
  );
}
