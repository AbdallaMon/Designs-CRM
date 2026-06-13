import { getData } from "@/app/helpers/functions/getData";
import {
  checkIfAdmin,
  checkIfAdminOrSuperSales,
} from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  Link,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import {
  MdInfoOutline,
  MdOutlineLaunch,
  MdPersonOutline,
} from "react-icons/md";

export const PreviewLead = ({
  open,
  onClose,
  id,
  setleads,
  page = false,
  type,
  url,
  leadContent,
  dontCheckIfNotUser,
  setRerenderColumns,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState(null);
  const { user } = useAuth();
  const isAdmin = checkIfAdminOrSuperSales(user);
  const LeadContent = leadContent;
  useEffect(() => {
    async function getALeadDetails() {
      if (open) {
        const leadDetails = await getData({
          url,

          // url: `shared/client-leads/projects/designers/${id}?type=${type}&`,
          setLoading,
        });
        if (leadDetails && leadDetails.status === 200) {
          setLead(leadDetails.data);
        }
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
  // if(!lead)return
  if (loading) return <></>;
  if (lead?.status === "CONVERTED" && lead.previousLeadId) {
    <Container maxWidth="md" sx={{ mb: 3 }}>
      <Alert
        severity="info"
        icon={<MdInfoOutline />}
        sx={{
          backgroundColor: "#e3f2fd",
          border: "1px solid #90caf9",
          borderRadius: "8px",
          "& .MuiAlert-icon": {
            color: "#1976d2",
          },
        }}
      >
        <AlertTitle sx={{ color: "#1565c0", fontWeight: 600 }}>
          Record Only - Converted Lead
        </AlertTitle>

        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="body2" sx={{ color: "#1976d2", mb: 2 }}>
            This lead is just a shadow lead for record only
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MdPersonOutline sx={{ fontSize: 18, color: "#1976d2" }} />
              <Typography variant="body2" sx={{ color: "#1565c0" }}>
                Converted From:
                <Chip
                  label={lead.assignedTo?.user?.name || "Unknown User"}
                  size="small"
                  sx={{
                    ml: 1,
                    backgroundColor: "#bbdefb",
                    color: "#1565c0",
                    fontSize: "0.75rem",
                  }}
                />
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MdOutlineLaunch sx={{ fontSize: 18, color: "#1976d2" }} />
              <Typography variant="body2" sx={{ color: "#1565c0" }}>
                Main lead:
                <Link
                  href={`/dashboard/deals/${lead.previousLeadId}`}
                  sx={{
                    ml: 1,
                    color: "#1976d2",
                    textDecoration: "none",
                    fontWeight: 500,
                    "&:hover": {
                      textDecoration: "underline",
                      color: "#1565c0",
                    },
                  }}
                >
                  #{lead.previousLeadId}
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Alert>
    </Container>;
  }
  if (
    (!loading && !lead) ||
    (!loading &&
      (lead?.status === "CONVERTED" ||
        (lead.status === "ON_HOLD" && user.id === lead.userId)))
  ) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            p: 2,
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f8d7da",
          }}
        >
          <FaExclamationTriangle size={40} color="#721c24" />
          <Typography variant="h6" sx={{ color: "#721c24", mt: 1 }}>
            You are not allowed to access this page or the lead doesn&apos;t
            exist
          </Typography>
        </Box>
      </Container>
    );
  }
  return (
    <>
      {page ? (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
              dontCheckIfNotUser={dontCheckIfNotUser}
              setRerenderColumns={setRerenderColumns}
            />
          )}
        </Container>
      ) : (
        <Dialog
          open={open}
          onClose={onClose}
          fullWidth
          maxWidth="lg"
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
                dontCheckIfNotUser={dontCheckIfNotUser}
                setRerenderColumns={setRerenderColumns}
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
