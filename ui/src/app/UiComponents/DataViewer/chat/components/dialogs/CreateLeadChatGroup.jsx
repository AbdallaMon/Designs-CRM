import {
  checkIfAdmin,
  checkIfAdminOrSuperSales,
} from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from "@mui/material";
import { CHAT_ROOM_TYPES } from "../../utils";
import ProjectGroupSelect from "../../../contracts/shared/ProjectGroupSelect";

export default function CreateLeadChatGroup({
  open,
  onClose,
  clientLeadId,
  onCreate,
}) {
  const { user } = useAuth();
  const checkIfAdmin = checkIfAdmin(user);
  if (!checkIfAdmin) return null;

  return (
    <Dialog
      open={open}
      onClose={resetAndClose}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        Create New Client Lead Group Chat
      </DialogTitle>
      <DialogContent dividers></DialogContent>
    </Dialog>
  );
}
function LeadChatGroupForm({ clientLeadId, onCreate }) {
  const [steps, setSteps] = useState(1);
  const [data, setData] = useState({
    groupType: null, // "Lead" || "Multi project"
    projectGroup: null,
    selectedProjectsTypes: [],
    addClient: false,
    addRelatedSalesStaff: false,
    addRelatedDesigners: false,
  });
  function handleGroupTypeChange(groupType) {
    setData((prevData) => ({ ...prevData, groupType }));
  }
  return (
    <Box>
      {steps === 1 && (
        <LeadGroupTypeSelect
          groupType={data.groupType}
          onChange={handleGroupTypeChange}
        />
      )}
      {/* {steps === 2 && (
        <LeadGroupTypeSelect
          groupType={data.groupType}
          onChange={handleGroupTypeChange}
        />
      )} */}
    </Box>
  );
}
function ProjectsSelectionStep({ clientLeadId, onSelect, data }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Select Projects
      </Typography>
      <ProjectGroups
        value={data.projectGroup}
        onChange={(value) => onSelect("projectGroup", value)}
        clientLeadId={clientLeadId}
      />
      {data.projectGroup && <></>}
    </Box>
  );
}
function LeadGroupTypeSelect({ groupType, onChange }) {
  return (
    <Box mb={3}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Select Group Type
      </Typography>
      <Box>
        <Grid container spacing={2}>
          <Grid size={6}>
            <Box
              p={2}
              border={1}
              borderColor="primary.main"
              borderRadius={2}
              sx={{ cursor: "pointer" }}
              onClick={() => onChange(CHAT_ROOM_TYPES.CLIENT_TO_STAFF)}
            >
              <Typography
                variant="body1"
                sx={{
                  fontWeight:
                    data.groupType === CHAT_ROOM_TYPES.CLIENT_TO_STAFF
                      ? 600
                      : 400,
                }}
              >
                Lead Group Chat
              </Typography>
            </Box>
          </Grid>
          <Grid size={6}>
            <Box
              p={2}
              border={1}
              borderColor="primary.main"
              borderRadius={2}
              sx={{ cursor: "pointer" }}
              onClick={() => onChange(CHAT_ROOM_TYPES.MULTI_PROJECT)}
            >
              <Typography
                variant="body1"
                sx={{
                  fontWeight:
                    data.groupType === CHAT_ROOM_TYPES.MULTI_PROJECT
                      ? 600
                      : 400,
                }}
              >
                Multi Project Group Chat
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
function ProjectGroups({ clientLeadId, value, onChange }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Select Project Group
      </Typography>
      <ProjectGroupSelect
        value={value}
        onChange={onChange}
        clientLeadId={clientLeadId}
      />
    </Box>
  );
}
