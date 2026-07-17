import {
  Divider,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import { MdAssignment, MdBusiness } from "react-icons/md";

export const RelatedLinks = ({ projectId, clientLeadId }) => {
  const hasLinks = projectId || clientLeadId;

  if (!hasLinks) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Related Items
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <List dense>
        {clientLeadId && (
          <ListItemButton
            component={Link}
            href={`/dashboard/deals/${clientLeadId}`}
          >
            <ListItemIcon>
              <MdBusiness />
            </ListItemIcon>
            <ListItemText
              primary="Client Lead"
              secondary={`Lead #${clientLeadId}`}
            />
          </ListItemButton>
        )}

        {projectId && (
          <ListItemButton
            component={Link}
            href={`/dashboard/projects/${projectId}`}
          >
            <ListItemIcon>
              <MdAssignment />
            </ListItemIcon>
            <ListItemText
              primary="Project"
              secondary={`Project #${projectId}`}
            />
          </ListItemButton>
        )}
      </List>
    </Paper>
  );
};
