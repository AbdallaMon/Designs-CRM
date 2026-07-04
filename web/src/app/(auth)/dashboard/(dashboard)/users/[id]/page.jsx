import { Container } from "@mui/material";
import UserDetails from "@/app/UiComponents/DataViewer/users/UserDetails.jsx";

export default async function page(props) {
  const params = await props.params;
  const { id } = params;
  return (
    <Container maxWidth="xxl">
      <UserDetails userId={id} />
    </Container>
  );
}
