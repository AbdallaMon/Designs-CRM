import React from "react";
import { Button, IconButton, Stack, Tooltip } from "@mui/material";
import { FiLink, FiExternalLink } from "react-icons/fi";
import DeleteModelButton from "@/shared/components/common/DeleteModelButton.jsx";
import { NotesComponent } from "@/shared/components/common/Notes.jsx";

function RowActions({
  reload,
  row,
  onOpenMeeting,
  onLinkMeeting,
  hasMeeting,
  meetingId,
  canDoActions,
}) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {hasMeeting ? (
        <Tooltip title="Open meeting details">
          <Button
            size="small"
            variant="outlined"
            startIcon={<FiExternalLink />}
            onClick={onOpenMeeting}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            #{meetingId}
          </Button>
        </Tooltip>
      ) : (
        <>
          {/* {canDoActions && (
            <Tooltip title="Link to meeting">
              <IconButton onClick={onLinkMeeting} color="primary">
                <FiLink />
              </IconButton>
            </Tooltip>
          )} */}
        </>
      )}
      <Tooltip title="Preview notes">
        <NotesComponent
          item={row}
          id={row.id}
          idKey="deliveryScheduleId"
          slug="shared"
        />
      </Tooltip>
      {canDoActions && (
        <Tooltip title="Delete delivery">
          <DeleteModelButton
            item={row}
            model={"DeliverySchedule"}
            contentKey=""
            onDelete={() => {
              reload();
            }}
          />
        </Tooltip>
      )}
    </Stack>
  );
}

export default RowActions;
