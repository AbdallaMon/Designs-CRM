"use client";
import { Box, Button, Chip, Grid, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { EmailRedirect, WhatsAppRedirect } from "./Utility";
import { LeadCategory } from "@/app/helpers/constants";

export function LeadCard({ lead }) {
  const { user } = useAuth();
  return (
    <Box
      sx={{
        p: 3,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor: "background.paper",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        transition: "box-shadow 0.2s ease-in-out",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        },
      }}
    >
      <Box sx={{ mb: 3, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography variant="h5" fontWeight={600} color="text.primary">
            {lead.client.name}
          </Typography>
          {user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? (
            <Button
              variant="text"
              color="text.secondary"
              component="a"
              href={`/dashboard/deals/${lead.id}`}
              sx={{
                fontFamily: "monospace",
                backgroundColor: "grey.100",
                px: 1,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              #{lead.id.toString().padStart(7, "0")}
            </Button>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontFamily: "monospace",
                backgroundColor: "grey.100",
                px: 1,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              #{lead.id.toString().padStart(7, "0")}
            </Typography>
          )}
        </Box>
        <Chip
          label={`Payment: ${lead.paymentStatus}`}
          color="primary"
          variant="outlined"
          size="small"
          sx={{ fontWeight: 500 }}
        />
        <Chip
          label={`Status: ${lead.status}`}
          color="secondary"
          variant="outlined"
          size="small"
          sx={{ fontWeight: 500 }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={500} color="text.primary" sx={{ mb: 2 }}>
          Lead Details
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
              <Typography
                color="text.secondary"
                variant="caption"
                sx={{ fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                Category
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                {LeadCategory[lead.selectedCategory]}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
              <Typography
                color="text.secondary"
                variant="caption"
                sx={{ fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                Location
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                {lead.country ? lead.country : lead.emirate}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
              <Typography
                color="text.secondary"
                variant="caption"
                sx={{ fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                Description
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.6 }}>
                {lead.description}
              </Typography>
            </Box>
          </Grid>
          {lead.clientDescription && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
                <Typography
                  color="text.secondary"
                  variant="caption"
                  sx={{ fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}
                >
                  Client Description
                </Typography>
                <Typography
                  variant="body1"
                  component="pre"
                  sx={{
                    textWrap: "auto",
                    wordBreak: "break-all",
                    mt: 1,
                    lineHeight: 1.6,
                    fontFamily: "inherit",
                  }}
                >
                  {lead.clientDescription}
                </Typography>
              </Box>
            </Grid>
          )}
          {lead.timeToContact && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
                <Typography
                  color="text.secondary"
                  variant="caption"
                  sx={{ fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}
                >
                  Preferred Contact Time
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {dayjs(lead.timeToContact).format("DD-MM-YYYY, HH:mm")}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>

      <Box>
        <Typography variant="h6" fontWeight={500} color="text.primary" sx={{ mb: 2 }}>
          Contact Information
        </Typography>
        <Grid container spacing={3}>
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{ "& .MuiBox-root": { width: "100%" } }}
          >
            <Box
              sx={{
                p: 2,
                backgroundColor: "primary.50",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "primary.200",
              }}
            >
              <Typography
                color="text.secondary"
                variant="caption"
                sx={{ fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                Client Name
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500, mb: 2 }}>
                {lead.client.name}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <WhatsAppRedirect lead={lead} />
              </Box>

              <Box>
                <Typography
                  color="text.secondary"
                  variant="caption"
                  sx={{ fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}
                >
                  Client Email
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <EmailRedirect email={lead.client.email} />
                </Box>
              </Box>
            </Box>
          </Grid>

          {lead.assignedTo && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "success.50",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "success.200",
                }}
              >
                <Typography
                  color="text.secondary"
                  variant="caption"
                  sx={{
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    mb: 1,
                    display: "block",
                  }}
                >
                  Assigned To
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                  {lead.assignedTo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {lead.assignedTo.email}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  Assigned: {dayjs(lead.assignedAt).format("DD/MM/YYYY")}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
}
