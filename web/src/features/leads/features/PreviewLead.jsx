import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { usePermission } from "@/app/hooks/usePermission";
import { LEAD_CODES } from "@/app/helpers/permissionCodes";
import FullScreenLoader from "@/shared/components/feedback/loaders/FullscreenLoader";
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
  Paper,
  Stack,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { LeadDetailsProvider } from "@/features/leads/context/LeadDetailsContext.jsx";
import { useLeadViewPreferences } from "@/features/leads/hooks/useLeadViewPreferences.js";
import { FaExclamationTriangle } from "react-icons/fa";
import {
  MdInfoOutline,
  MdOutlineLaunch,
  MdPersonOutline,
  MdWork,
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
  // In full-page mode the active section is persisted in the URL (`?tab=<key>`) so it
  // survives other searchParam pushes and is restored on reload. In modal/kanban-card
  // mode it's local state. The value is now the section KEY (e.g. "notes"), not an index.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialTab = page ? searchParams.get("tab") || "" : "";
  const [activeTab, setActiveTabState] = useState(initialTab || "details");
  const setActiveTab = (val) => {
    setActiveTabState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      if (page && typeof window !== "undefined") {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.set("tab", String(next));
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
      return next;
    });
  };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // Remembered fullscreen preference (modal mode only — the full-page route is already
  // full-bleed). Persisted per-browser so the next lead opens the same way.
  const { fullscreen, setFullscreen } = useLeadViewPreferences();
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { setLoading: setToastLoading } = useToastContext() || {};
  // admin-tier lead operator = holds lead.assign.other (== checkIfAdminOrSuperSales); honors subRoles per the profiles model
  const isAdmin = hasPermission(LEAD_CODES.ASSIGN_OTHER);
  const LeadContent = leadContent;

  async function getALeadDetails() {
    if (open) {
      const leadDetails = await getData({
        url,

        // url: `leads/projects/designers/${id}?type=${type}&`,
        setLoading,
      });
      if (leadDetails && leadDetails.status === 200) {
        setLead(leadDetails.data);
        setErrorInfo(null);
      } else if (leadDetails) {
        // getData attaches `error` (resolved message + redirect meta) on non-2xx.
        setErrorInfo({
          code: leadDetails.message || null,
          message: leadDetails.error?.message || null,
        });
      }
    }
  }

  useEffect(() => {
    getALeadDetails();
  }, [id, open]);

  async function handleClaim() {
    const res = await handleRequestSubmit(
      { id },
      setToastLoading || setLoading,
      `leads`,
      false,
      "Assigning",
      false,
      "PUT"
    );
    if (res.status === 200) {
      setErrorInfo(null);
      await getALeadDetails();
    }
  }

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
    const resolvedErrorMessage =
      errorInfo?.message ||
      "You are not allowed to access this page or the lead doesn't exist";
    const canClaim = errorInfo?.code === "LEAD_CLAIM_REQUIRED";
    const body = (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          textAlign: "center",
          gap: 1.5,
          p: 5,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(theme.palette.error.main, 0.12),
          }}
        >
          <FaExclamationTriangle size={28} color={theme.palette.error.dark} />
        </Box>
        <Typography variant="h6" sx={{ color: theme.palette.error.dark }}>
          {resolvedErrorMessage}
        </Typography>
        {canClaim && (
          <Button
            variant="contained"
            startIcon={<MdWork />}
            onClick={handleClaim}
          >
            Start Deal
          </Button>
        )}
      </Box>
    );

    if (page) {
      return (
        <Container maxWidth="sm" sx={{ mt: 6 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
              bgcolor: alpha(theme.palette.error.main, 0.05),
            }}
          >
            {body}
          </Paper>
        </Container>
      );
    }

    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        {body}
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const content = (
    <LeadDetailsProvider
      lead={lead}
      setLead={setLead}
      leadBaseUrl={url}
      setRerenderColumns={setRerenderColumns}
    >
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
        initialTabExplicit={Boolean(initialTab)}
        fullscreen={fullscreen}
        onToggleFullscreen={page ? undefined : () => setFullscreen()}
      />
    </LeadDetailsProvider>
  );

  return (
    <>
      {page ? (
        <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: 4 }}>
          {loading ? (
            <FullScreenLoader />
          ) : (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.shadows[2],
              }}
            >
              {content}
            </Paper>
          )}
        </Container>
      ) : (
        <Dialog
          open={open}
          onClose={onClose}
          fullWidth
          maxWidth="lg"
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 4 },
              overflow: "hidden",
              // Flex column: a scrollable body + a pinned actions bar, capped to the
              // viewport so tall tab content always scrolls instead of being clipped.
              display: "flex",
              flexDirection: "column",
              maxHeight: { xs: "100%", sm: fullscreen ? "100%" : "92vh" },
            },
          }}
          fullScreen={isMobile || fullscreen}
        >
          {loading ? (
            <FullScreenLoader />
          ) : (
            <>
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  "&::-webkit-scrollbar": { width: 8 },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.25),
                    borderRadius: 4,
                  },
                }}
              >
                {content}
              </Box>
              <DialogActions
                sx={{
                  flexShrink: 0,
                  p: 2,
                  borderTop: 1,
                  borderColor: "divider",
                  bgcolor: alpha(theme.palette.background.default, 0.5),
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
