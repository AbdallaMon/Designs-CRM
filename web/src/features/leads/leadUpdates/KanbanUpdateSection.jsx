import { Box, Typography } from "@mui/material";
import { LEAD_STATUSES, WORK_DEPARTMENTS } from "@dms/shared";
import { CreateUpdateModal } from "@/features/leads/leadUpdates/CreateUpdate.jsx";
import LeadListModal from "@/features/leads/leadUpdates/LeadListModal.jsx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function KanbanUpdateSection({
  lead,
  currentUserDepartment = WORK_DEPARTMENTS.STAFF,
  setleads,
}) {
  if (lead.status !== LEAD_STATUSES.FINALIZED) return null;
  const latestUpdate = lead.updates?.[0] ?? null;

  return (
    <Box
      sx={{
        mt: 0.5,
        pt: 1,
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
        mb={0.75}
      >
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          Latest project update
        </Typography>
        <Box display="flex" alignItems="center" gap={0.5} flexShrink={0}>
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
          <LeadListModal
            clientLeadId={lead.id}
            currentUserDepartment={currentUserDepartment}
            triggerLabel="History"
            triggerVariant="text"
            triggerSx={{ minWidth: 0, px: 0.75 }}
          />
        </Box>
      </Box>
      <Box sx={{ minWidth: 0, px: 1, py: 0.75, borderRadius: "8px", bgcolor: "action.hover" }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {latestUpdate?.title || "No project updates yet"}
        </Typography>
        {latestUpdate?.updatedAt && (
          <Typography variant="caption" color="text.secondary">
            {dayjs(latestUpdate.updatedAt).fromNow()}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
