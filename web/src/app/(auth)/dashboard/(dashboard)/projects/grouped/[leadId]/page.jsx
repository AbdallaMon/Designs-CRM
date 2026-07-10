import LeadProjects from "@/features/work-stages/projects/LeadProjects";
import { Container } from "@mui/material";

export default function GroupedProjects({ params }) {
  const { leadId } = params;
  return (
    <Container maxWidth="md">
      <LeadProjects clientLeadId={leadId} />
    </Container>
  );
}
