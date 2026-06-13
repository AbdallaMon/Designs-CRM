"use client";
// Shared design kit for the lead/deal detail tab bodies. One vocabulary so every tab
// (calls, meetings, notes, files, price offers, details…) reads as the same system:
//   • TabSection  — the unified tab frame: header (icon tile · title · count · action) + body.
//   • RecordCard  — the unified list-item card: optional accent rail, header row
//                   (leading · title/subtitle · status), body, and a footer (meta · actions).
//   • InfoGrid / Field — the unified key→value display for the Details overview.
//   • MetaItem    — a small icon+label+value cluster used in card footers.
import {
  Avatar,
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

/** The frame every tab body sits in: a consistent header + spaced content. */
export function TabSection({ icon, title, count, action, description, children }) {
  const theme = useTheme();
  const hasCount = typeof count === "number";
  return (
    <Stack spacing={2.5}>
      <Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            {icon && (
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                  fontSize: 21,
                  flexShrink: 0,
                }}
              >
                {icon}
              </Box>
            )}
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" fontWeight={700} color="text.primary" noWrap>
                  {title}
                </Typography>
                {hasCount && (
                  <Box
                    sx={{
                      px: 1,
                      py: 0.1,
                      borderRadius: 1.5,
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "primary.main",
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                    }}
                  >
                    {count}
                  </Box>
                )}
              </Stack>
              {description && (
                <Typography variant="caption" color="text.secondary">
                  {description}
                </Typography>
              )}
            </Box>
          </Stack>
          {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
        </Stack>
        <Divider sx={{ mt: 1.5 }} />
      </Box>
      {children}
    </Stack>
  );
}

/** The unified list-item card. All slots optional so each tab fills what it needs. */
export function RecordCard({
  accent,
  leading,
  title,
  subtitle,
  status,
  meta,
  actions,
  children,
  sx,
}) {
  const theme = useTheme();
  const accentColor = accent || theme.palette.primary.main;
  const hasHeader = leading || title || subtitle || status;
  const hasFooter = meta || actions;
  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${theme.palette.divider}`,
        borderLeft: `3px solid ${accentColor}`,
        bgcolor: "background.paper",
        p: 2.25,
        transition: "box-shadow .2s ease, border-color .2s ease, transform .2s ease",
        "&:hover": {
          boxShadow: theme.shadows[3],
          borderColor: alpha(accentColor, 0.5),
        },
        ...sx,
      }}
    >
      {hasHeader && (
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            {leading}
            {(title || subtitle) && (
              <Box sx={{ minWidth: 0 }}>
                {title && (
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    color="text.primary"
                    sx={{ lineHeight: 1.3 }}
                  >
                    {title}
                  </Typography>
                )}
                {subtitle && (
                  <Typography variant="caption" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}
              </Box>
            )}
          </Stack>
          {status && <Box sx={{ flexShrink: 0 }}>{status}</Box>}
        </Stack>
      )}

      {children && <Box sx={{ mt: hasHeader ? 1.5 : 0 }}>{children}</Box>}

      {hasFooter && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            useFlexGap
          >
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
              {meta}
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              {actions}
            </Stack>
          </Stack>
        </>
      )}
    </Box>
  );
}

/** A small "label + value" cluster (with an optional leading icon) for card footers. */
export function MetaItem({ icon, label, value, color }) {
  const theme = useTheme();
  return (
    <Stack direction="row" spacing={0.6} alignItems="center" sx={{ minWidth: 0 }}>
      {icon && (
        <Box sx={{ display: "flex", color: color || theme.palette.text.secondary }}>
          {icon}
        </Box>
      )}
      {label && (
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
      )}
      {value != null && (
        <Typography variant="caption" color="text.primary" sx={{ fontWeight: 600 }} noWrap>
          {value}
        </Typography>
      )}
    </Stack>
  );
}

/** A soft "callout" block for highlighted body content (reason / result / note). */
export function CardBlock({ label, color, children }) {
  const theme = useTheme();
  const c = color || theme.palette.text.secondary;
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: alpha(c, 0.06),
        border: `1px solid ${alpha(c, 0.18)}`,
      }}
    >
      {label && (
        <Typography
          variant="overline"
          sx={{ fontWeight: 700, color: c, lineHeight: 1.4, display: "block" }}
        >
          {label}
        </Typography>
      )}
      <Typography variant="body2" color="text.primary" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {children}
      </Typography>
    </Box>
  );
}

/** Responsive key→value grid for the Details overview. */
export function InfoGrid({ children, columns = { xs: 1, sm: 2 } }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: `repeat(${columns.xs || 1}, minmax(0, 1fr))`,
          sm: `repeat(${columns.sm || 2}, minmax(0, 1fr))`,
        },
        gap: 1.5,
      }}
    >
      {children}
    </Box>
  );
}

/** One key→value cell. */
export function Field({ icon, label, value, full }) {
  const theme = useTheme();
  if (value == null || value === "") return null;
  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="flex-start"
      sx={{ gridColumn: full ? "1 / -1" : "auto", minWidth: 0 }}
    >
      {icon && (
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            flexShrink: 0,
            fontSize: 14,
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography
          variant="body2"
          color="text.primary"
          sx={{ fontWeight: 600, wordBreak: "break-word" }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

/** Avatar from a name (used as a RecordCard leading slot). */
export function NameAvatar({ name, color, size = 38 }) {
  const theme = useTheme();
  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: color || theme.palette.primary.main,
        color: "#fff",
        fontSize: size * 0.42,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {name ? name[0] : "?"}
    </Avatar>
  );
}

/** Small status chip with consistent soft styling. */
export function StatusPill({ label, color, icon }) {
  const theme = useTheme();
  const c = color || theme.palette.text.secondary;
  return (
    <Chip
      size="small"
      icon={icon}
      label={label}
      sx={{
        fontWeight: 700,
        borderRadius: 1.5,
        color: c,
        bgcolor: alpha(c, 0.12),
        border: `1px solid ${alpha(c, 0.3)}`,
        "& .MuiChip-icon": { color: c },
      }}
    />
  );
}
