import { Container} from "@mui/material";
import Dashboard from "@/app/UiComponents/DataViewer/dashbaord/Dashboard.jsx";

export default function page({params:{id}}){
return(
      <Container maxWidth="xl">
            <Dashboard staffId={id} staff={false}/>
      </Container>
)
}