import { Container } from "@mui/material";
import Dashboard from "@/app/UiComponents/DataViewer/dashboard/Dashboard.jsx";

export default async function page(props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { id } = params;
  return (
    <Container maxWidth="xxl">
      <Dashboard staffId={id} staff={false} userRole={searchParams.role} />
    </Container>
  );
}
