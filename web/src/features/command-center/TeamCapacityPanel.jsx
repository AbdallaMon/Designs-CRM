"use client";
// TeamCapacityPanel — designer active-project load and salesperson lead load, each row
// linking to the user's detail screen. An "Overloaded" chip surfaces the backend-computed
// flag. The auto-assign rotation is summarized as compact chips. Only id + name + role +
// counts are exposed (no PII beyond what the admin already sees on the users screen).
import NextLink from "next/link";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { FiChevronRight } from "react-icons/fi";
import LoadingOverlay from "@/shared/components/feedback/loaders/LoadingOverlay.jsx";

const DESIGNER_ROLE_LABELS = {
  THREE_D_DESIGNER: "3D Designer",
  TWO_D_DESIGNER: "2D Designer",
  TWO_D_EXECUTOR: "Executor",
};

function roleLabel(role) {
  return DESIGNER_ROLE_LABELS[role] || String(role || "").replace(/_/g, " ");
}

function OverloadedChip() {
  return (
    <Chip
      size="small"
      label="Overloaded"
      color="error"
      variant="outlined"
      sx={{ fontWeight: 700, borderRadius: 1.5 }}
    />
  );
}

function CapacityRow({ href, primary, secondary, overloaded }) {
  return (
    <Box
      component={NextLink}
      href={href}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1,
        py: 1,
        borderRadius: 1.5,
        textDecoration: "none",
        color: "inherit",
        transition: "background-color .15s ease",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
          {primary}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {secondary}
        </Typography>
      </Box>
      {overloaded && <OverloadedChip />}
      <FiChevronRight size={16} style={{ flexShrink: 0, opacity: 0.5 }} />
    </Box>
  );
}

function CapacitySection({ title, children, empty }) {
  return (
    <Box>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ fontWeight: 700, letterSpacing: 0.5 }}
      >
        {title}
      </Typography>
      {children == null || (Array.isArray(children) && children.length === 0) ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          {empty}
        </Typography>
      ) : (
        <Stack sx={{ mt: 0.5 }}>{children}</Stack>
      )}
    </Box>
  );
}

export default function TeamCapacityPanel({ capacity, loading }) {
  const designers = Array.isArray(capacity?.designers) ? capacity.designers : [];
  const sales = Array.isArray(capacity?.sales) ? capacity.sales : [];
  const autoAssign = Array.isArray(capacity?.autoAssign) ? capacity.autoAssign : [];

  return (
    <Card sx={{ height: "100%", boxShadow: 3, borderRadius: 2, position: "relative" }}>
      {loading && <LoadingOverlay />}
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", color: "text.primary" }}>
          Team Capacity
        </Typography>

        <Stack spacing={2} sx={{ mt: 1 }} divider={<Divider flexItem />}>
          <CapacitySection title="Designers" empty="No designer load.">
            {designers.map((d) => (
              <CapacityRow
                key={`d-${d.userId}`}
                href={`/dashboard/users/${d.userId}`}
                primary={d.name || `User #${d.userId}`}
                secondary={`${roleLabel(d.role)} · ${d.activeProjects} active project${
                  d.activeProjects === 1 ? "" : "s"
                }`}
                overloaded={d.overloaded}
              />
            ))}
          </CapacitySection>

          <CapacitySection title="Sales" empty="No sales load.">
            {sales.map((s) => (
              <CapacityRow
                key={`s-${s.userId}`}
                href={`/dashboard/users/${s.userId}`}
                primary={s.name || `User #${s.userId}`}
                secondary={`${s.activeLeads} / ${s.maxLeads} active leads`}
                overloaded={s.overloaded}
              />
            ))}
          </CapacitySection>

          {autoAssign.length > 0 && (
            <Box>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontWeight: 700, letterSpacing: 0.5 }}
              >
                Auto-assign rotation
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
                {autoAssign.map((a) => (
                  <Chip
                    key={a.type}
                    size="small"
                    label={`${roleLabel(a.type)} · ${a.activeUsers} active`}
                    sx={{ fontWeight: 600, borderRadius: 1.5 }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
