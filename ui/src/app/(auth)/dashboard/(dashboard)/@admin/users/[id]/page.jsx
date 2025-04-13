import { Container} from "@mui/material";
import Dashboard from "@/app/UiComponents/DataViewer/dashbaord/Dashboard.jsx";

export default async function page(props) {
      const params = await props.params;

      const {
            id
      } = params;

      return(
            <Container maxWidth="xl">
                  <Dashboard staffId={id} staff={false}/>
            </Container>
      )
}