"use client";
// The redesigned lead/deal detail BODY: a grouped left-rail "workspace" that replaces
// the old horizontal scrollable tab bar + index-based panels. Sections come from the
// config registry (config/leadSections.jsx); the active section is keyed (not indexed);
// count badges are read LIVE from the per-tab cache (LeadDetailsProvider) when a section
// has been opened, falling back to the core lead's bundled counts.
//
// Responsive: a vertical grouped rail on md+, a horizontal chip scroller on xs.
import {
  alpha,
  Badge,
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";
import { useLeadDetails } from "@/features/leads/context/LeadDetailsContext.jsx";
import { LEAD_SECTION_GROUPS } from "@/features/leads/config/leadSections.jsx";
import { useLeadViewPreferences } from "@/features/leads/hooks/useLeadViewPreferences.js";

function useSectionCount(section, ctx) {
  const ld = useLeadDetails();
  if (section.tabKey && ld?.getTab) {
    const t = ld.getTab(section.tabKey);
    if (t?.loaded) return t.data?.length ?? 0;
  }
  return section.count ? section.count(ctx) : undefined;
}

function NavItem({ section, ctx, active, onClick, horizontal, collapsed }) {
  const theme = useTheme();
  const count = useSectionCount(section, ctx);
  const hasCount = typeof count === "number";

  const row = (
    <Stack
      role="tab"
      aria-selected={active}
      direction="row"
      spacing={collapsed ? 0 : 1.25}
      alignItems="center"
      justifyContent={collapsed ? "center" : "flex-start"}
      onClick={onClick}
      sx={{
        cursor: "pointer",
        px: collapsed ? 0 : 1.5,
        py: 1,
        borderRadius: 2,
        userSelect: "none",
        whiteSpace: "nowrap",
        minWidth: horizontal ? "fit-content" : 0,
        color: active ? "primary.main" : "text.secondary",
        bgcolor: active ? alpha(theme.palette.primary.main, 0.1) : "transparent",
        border: `1px solid ${
          active ? alpha(theme.palette.primary.main, 0.35) : "transparent"
        }`,
        transition: "background-color .15s ease, color .15s ease",
        "&:hover": {
          bgcolor: active
            ? alpha(theme.palette.primary.main, 0.14)
            : alpha(theme.palette.text.primary, 0.04),
          color: active ? "primary.main" : "text.primary",
        },
      }}
    >
      {/* Icon — in collapsed mode the live count is shown as a small dot overlay so the
          "has items" signal survives without the numeric badge. */}
      <Badge
        variant="dot"
        color="primary"
        invisible={!collapsed || !hasCount || count <= 0}
        overlap="circular"
        sx={{
          "& .MuiBadge-badge": {
            bgcolor: active ? "primary.main" : alpha(theme.palette.text.primary, 0.45),
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "inherit",
            flexShrink: 0,
          }}
        >
          {section.icon}
        </Box>
      </Badge>
      {!collapsed && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: active ? 700 : 600,
            color: "inherit",
            flex: horizontal ? "0 0 auto" : 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {section.label}
        </Typography>
      )}
      {!collapsed && hasCount && count > 0 && (
        <Badge
          badgeContent={count}
          color={active ? "primary" : "default"}
          sx={{
            "& .MuiBadge-badge": {
              position: "static",
              transform: "none",
              fontWeight: 700,
              bgcolor: active
                ? "primary.main"
                : alpha(theme.palette.text.primary, 0.1),
              color: active ? "#fff" : "text.secondary",
            },
          }}
        />
      )}
    </Stack>
  );

  // Collapsed: the label lives in a tooltip (mirrors the sidenav collapsed behavior).
  return collapsed ? (
    <Tooltip title={section.label} placement="right">
      {row}
    </Tooltip>
  ) : (
    row
  );
}

export function LeadWorkspace({ sections, activeKey, onChange, ctx }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  // Remembered rail-collapse preference (md+ only). Persisted per-browser so the next
  // lead opens with the same rail state.
  const { railCollapsed, setRailCollapsed } = useLeadViewPreferences();
  // Collapse only applies to the md+ vertical rail, never the xs chip scroller.
  const collapsed = !isMobile && railCollapsed;

  const active =
    sections.find((s) => s.key === activeKey) || sections[0] || null;

  if (!active) return null;

  const renderNav = (horizontal) => {
    if (horizontal) {
      // xs: a single horizontal scroller of all visible sections (no group labels).
      return (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            overflowX: "auto",
            px: 1.5,
            py: 1,
            "&::-webkit-scrollbar": { height: 5 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: alpha(theme.palette.primary.main, 0.3),
              borderRadius: 3,
            },
          }}
        >
          {sections.map((s) => (
            <NavItem
              key={s.key}
              section={s}
              ctx={ctx}
              active={s.key === active.key}
              onClick={() => onChange(s.key)}
              horizontal
            />
          ))}
        </Stack>
      );
    }
    // md+: grouped vertical rail (collapses to an icons-only strip + tooltips).
    return (
      <Stack spacing={collapsed ? 1 : 2} sx={{ p: 1.5 }}>
        {/* Collapse / expand toggle — pinned at the top of the rail. */}
        <Box
          sx={{
            display: "flex",
            justifyContent: collapsed ? "center" : "flex-end",
          }}
        >
          <Tooltip
            title={collapsed ? "Expand" : "Collapse"}
            placement="right"
          >
            <IconButton
              size="small"
              onClick={() => setRailCollapsed()}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                color: "text.secondary",
                "&:hover": { color: "primary.main" },
              }}
            >
              {collapsed ? (
                <MdKeyboardDoubleArrowRight size={18} />
              ) : (
                <MdKeyboardDoubleArrowLeft size={18} />
              )}
            </IconButton>
          </Tooltip>
        </Box>
        {LEAD_SECTION_GROUPS.map((group) => {
          const groupSections = sections.filter((s) => s.group === group.key);
          if (!groupSections.length) return null;
          return (
            <Box key={group.key}>
              {!collapsed && (
                <Typography
                  variant="overline"
                  sx={{
                    px: 1.5,
                    color: "text.disabled",
                    fontWeight: 700,
                    letterSpacing: 0.6,
                  }}
                >
                  {group.label}
                </Typography>
              )}
              <Stack spacing={0.5} sx={{ mt: collapsed ? 0 : 0.5 }}>
                {groupSections.map((s) => (
                  <NavItem
                    key={s.key}
                    section={s}
                    ctx={ctx}
                    active={s.key === active.key}
                    onClick={() => onChange(s.key)}
                    collapsed={collapsed}
                  />
                ))}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        bgcolor: alpha(theme.palette.background.default, 0.25),
      }}
    >
      {/* Left rail (md+) / top scroller (xs) */}
      <Box
        sx={{
          flexShrink: 0,
          width: { xs: "100%", md: collapsed ? 76 : 256 },
          transition: "width .15s ease",
          borderRight: { md: `1px solid ${theme.palette.divider}` },
          borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: "none" },
          bgcolor: alpha(theme.palette.background.paper, 0.6),
          alignSelf: { md: "stretch" },
        }}
      >
        {renderNav(isMobile)}
      </Box>

      {/* Content pane — flows naturally; scrolling is owned by the dialog/page
          container so content can never be clipped out of reach. */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          p: { xs: 1.5, md: 3 },
        }}
      >
        {active.render(ctx)}
      </Box>
    </Box>
  );
}
