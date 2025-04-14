import { getData } from "@/app/helpers/functions/getData";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import {
  Button,
  Container,
  Dialog,
  DialogActions,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";

export const PreviewLead = ({
  open,
  onClose,
  id,
  setleads,
  page = false,
  type,
  url,
  leadContent,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState(null);
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  const LeadContent = leadContent;
  useEffect(() => {
    async function getALeadDetails() {
      if (open) {
        const leadDetails = await getData({
          url,

          // url: `shared/client-leads/projects/designers/${id}?type=${type}&`,
          setLoading,
        });
        setLead(leadDetails.data);
      }
    }
    getALeadDetails();
  }, [id, open]);

  const handlePageClose = (isPage) => {
    if (isPage) {
      window.history.back();
      return;
    }
    if (onClose) onClose();
  };
  return (
    <>
      {page ? (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          {loading ? (
            <FullScreenLoader />
          ) : (
            <LeadContent
              lead={lead}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              theme={theme}
              isMobile={isMobile}
              handleClose={handlePageClose}
              setLead={setLead}
              setleads={setleads}
              admin={isAdmin}
              isPage={page}
              type={type}
            />
          )}
        </Container>
      ) : (
        // Render as a Dialog
        <Dialog
          open={open}
          onClose={onClose}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: { borderRadius: 2 },
          }}
          fullScreen={isMobile}
        >
          {loading ? (
            <FullScreenLoader />
          ) : (
            <>
              <LeadContent
                lead={lead}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                theme={theme}
                isMobile={isMobile}
                handleClose={handlePageClose}
                setLead={setLead}
                setleads={setleads}
                admin={isAdmin}
                type={type}
              />
              <DialogActions
                sx={{
                  p: 2,
                  borderTop: 1,
                  borderColor: "divider",
                  gap: 1,
                }}
              >
                <Button onClick={onClose} variant="outlined">
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      )}
    </>
  );
};
