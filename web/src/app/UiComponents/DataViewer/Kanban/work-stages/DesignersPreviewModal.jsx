import React, { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  Divider,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdAdd, MdAssignmentInd, MdDelete } from "react-icons/md";
import colors from "@/app/helpers/colors";
import { AssignDesignerModal } from "@/app/UiComponents/DataViewer/work-stages/projects/AssignDesignerModal.jsx";
import { StyledDesignerCard } from "@/app/UiComponents/DataViewer/work-stages/projects/ProjectDetails.jsx";
import { StyledCard } from "@/app/UiComponents/DataViewer/Kanban/work-stages/workStageKanbanStyles.js";

const DesignersPreviewModal = ({ lead }) => {
  const [open, setOpen] = useState(false);
  const [assignmentId, setAssignmentId] = useState(null);
  const [deleteDesigner, setDeleteDesigner] = useState(false);
  const [openDesignerModal, setOpenDesignerModal] = useState(false);

  return (
    <>
      <Button
        mb={1}
        startIcon={<MdAssignmentInd size={22} color={colors.primary} />}
        variant="outlined"
        onClick={() => setOpenDesignerModal(true)}
      >
        View assigned designers
      </Button>
      <Dialog
        open={openDesignerModal}
        onClose={() => setOpenDesignerModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <Grid size={12} sx={{ mt: 3 }}>
            <StyledCard sx={{ p: 0, overflow: "visible" }}>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <MdAssignmentInd size={22} color={colors.primary} />
                    <Typography variant="h6" sx={{ ml: 1.5, fontWeight: 600 }}>
                      Project Designers
                    </Typography>
                  </Box>
                }
                action={
                  <Button
                    onClick={() => {
                      setOpen(true);
                      setAssignmentId(null);
                      setDeleteDesigner(false);
                    }}
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<MdAdd />}
                  >
                    Assign New Designer
                  </Button>
                }
                sx={{ px: 3, pt: 2.5, pb: 1 }}
              />

              <Divider sx={{ mx: 3 }} />

              <CardContent sx={{ p: 3 }}>
                {lead.projects[0].assignments?.length ? (
                  lead.projects[0].assignments?.map((assignment) => (
                    <StyledDesignerCard key={assignment.id}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 40,
                            height: 40,
                          }}
                        >
                          {assignment.user.name.charAt(0)}
                        </Avatar>
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {assignment.user.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {assignment.user.email}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Remove from project">
                          <Button
                            onClick={() => {
                              setOpen(true);
                              setAssignmentId(assignment.id);
                              setDeleteDesigner(true);
                            }}
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<MdDelete />}
                          >
                            Remove
                          </Button>
                        </Tooltip>
                      </Box>
                    </StyledDesignerCard>
                  ))
                ) : (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body1" color="text.secondary">
                      No designers assigned to this project yet
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </StyledCard>
          </Grid>
        </DialogContent>
      </Dialog>
      {open && (
        <AssignDesignerModal
          open={open}
          project={lead.projects[0]}
          setOpen={setOpen}
          onUpdate={() => {
            window.location.reload();
          }}
          assignmentId={assignmentId}
          deleteDesigner={deleteDesigner}
        />
      )}
    </>
  );
};

export default DesignersPreviewModal;
