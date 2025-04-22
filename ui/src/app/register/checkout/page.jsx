import colors from "@/app/helpers/colors";
import { CheckoutPage } from "@/app/UiComponents/client-page/new-register/CheckoutPage";
import { Button, Container, Paper } from "@mui/material";
import { MdArrowBack } from "react-icons/md";

export default function page({ searchParams }) {
  const { lng, leadId, clientId } = searchParams;
  const clientLead = {
    id: leadId,
    clientId,
  };

  return (
    <Paper
      elevation={2}
      sx={{
        backgroundColor: colors.bgPrimary,
        width: "100%",
        height: "100vh",
        overflowY: "hidden",
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          height: "100%",
          py: { xs: 5, md: 6 },
          pb: { xs: 16, md: 10 },
          position: "relative",
        }}
      >
        <Button
          variant="outlined"
          component="a"
          href="/register"
          sx={{
            position: "absolute",
            left: { xs: 15, md: 25 },
            top: 5,
          }}
        >
          <MdArrowBack size={20} />
        </Button>
        <CheckoutPage
          lng={lng}
          clientLead={clientLead}
          test={searchParams.test}
        />
      </Container>
    </Paper>
  );
}
