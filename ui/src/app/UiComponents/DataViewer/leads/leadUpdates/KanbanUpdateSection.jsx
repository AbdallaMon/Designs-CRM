import { Box, Typography } from "@mui/material";
import { CreateUpdateModal } from "./CreateUpdate";
import LeadListModal from "./LeadListModal";
import { UpdateCard } from "./UpdateCard";

export function KanbanUpdateSection({
  lead,
  currentUserDepartment = "STAFF",
  setleads,setRerenderColumns
}) {
  const onToggleArchive = (update) => {
    window.location.reload();
  };
  function onUpdate(newUpdate) {
if(setRerenderColumns){
          setRerenderColumns((prev) => ({
          ...prev,
          [lead.status]: !prev[lead.status],
        }));
        return
}
    if(setleads){
setleads((oldleads) =>
      oldleads.map((l) => {
        if (l.id === lead.id) {
          return {
            ...l,
            updates: l.updates.map((up) => {
              if (up.id === newUpdate.id) {
                return newUpdate;
              }
              return up;
            }),
          };
        }
        return l;
      })
    );
  }
  }
  if (lead.status !== "FINALIZED") return null;

  return (
    <Box>
      <Box mb={0.5}>
        <Typography variant="h6" component="h1" fontWeight="bold">
          Latest 5 Updates
        </Typography>
      </Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={0.5}
        py={1}
      >
        <CreateUpdateModal
          simpleButton={true}
          onCreate={(newUpdate) => {
            if (setleads) {
              setleads((oldleads) =>
                oldleads.map((l) => {
                  if (l.id === lead.id) {
                    return {
                      ...l,
                      updates: [newUpdate, ...l.updates],
                    };
                  }
                  return l;
                })
              );
            }
          }}
          clientLeadId={lead.id}
          currentUserDepartment={currentUserDepartment}
        />
        <>
          <LeadListModal
            clientLeadId={lead.id}
            currentUserDepartment={currentUserDepartment}
          />
        </>
      </Box>
      {lead.updates?.map((update) => (
        <UpdateCard
          key={update.id}
          update={update}
          currentUserDepartment={currentUserDepartment}
          isSimple={true}
          //todo handleDepartmentToggle onUpdate
          onToggleArchive={onUpdate}
          onUpdate={onUpdate}
        />
      ))}
    </Box>
  );
}
