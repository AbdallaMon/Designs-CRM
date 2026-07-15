"use client";
// The aging unclaimed leads behind the team lens' "N new lead(s) unclaimed" exception.
// These have no owner, so they can't route to a person — this drawer names each specific
// lead and links out so a supervisor can open and claim/assign it.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@mui/material/styles";
import { Alert, Box, Button, Chip, Drawer, IconButton, Skeleton, Stack, Typography } from "@mui/material";
import { FiX } from "react-icons/fi";
import { getData } from "@/app/helpers/functions/getData.js";

function Body() {
  const theme = useTheme();
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchLeads = useCallback(async () => {
    setError(false);
    const res = await getData({ url: "my-day/unclaimed", setLoading });
    if (res && res.status === 200) setItems(res.data?.items ?? []);
    else setError(true);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  if (loading) {
    return (
      <Stack spacing={1.5}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={64} />
        ))}
      </Stack>
    );
  }
  if (error) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchLeads}>Retry</Button>}>
        Couldn&apos;t load the unclaimed leads.
      </Alert>
    );
  }
  if (!items?.length) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: theme.palette.success.main }}>
          Nothing unclaimed — every new lead has an owner.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      {items.map((item) => (
        <Box
          key={item.leadId}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {item.clientName || `Lead #${item.leadId}`}
            </Typography>
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              label={`Unclaimed ${item.agingDays}d`}
              sx={{ mt: 0.5 }}
            />
          </Box>
          <Button
            component={Link}
            href={`/dashboard/deals/${item.leadId}`}
            size="small"
            variant="outlined"
            sx={{ flexShrink: 0 }}
          >
            Open
          </Button>
        </Box>
      ))}
    </Stack>
  );
}

export default function UnclaimedLeadsDrawer({ open, onClose }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 460 }, maxWidth: "100%" } }}
    >
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Unclaimed leads
          </Typography>
          <IconButton onClick={onClose} aria-label="Close">
            <FiX />
          </IconButton>
        </Stack>
        {open && <Body />}
      </Box>
    </Drawer>
  );
}
