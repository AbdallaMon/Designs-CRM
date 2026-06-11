"use client";

// <SideNav /> — the grouped, permission-filtered side navigation (UX plan §1.2). Builds the
// visible nav model from nav.config (the same usePermission predicate that gates pages/actions),
// renders grouped items with Next <Link> client transitions, and marks the active item via an
// exact/segment usePathname() match (NOT `.includes`). Two render modes:
//   variant="full" — labels + icons (lg+ and the xs Drawer).
//   variant="rail" — icon-only rail with tooltips (md).
// RTL: the nav sits at the inline-START (right) via the Drawer anchor in <AppShell>.
// Single-language Arabic / RTL.

import { usePathname } from "next/navigation";
import NextLink from "next/link";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Tooltip,
  Divider,
} from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { buildVisibleNav } from "../nav.config";
import { resolveNavGroup, resolveNavItem } from "../navLabels";
import { isPathActive } from "../breadcrumbs";

export function SideNav({ variant = "full", onNavigate }) {
  const perm = usePermission();
  const pathname = usePathname();
  const groups = buildVisibleNav(perm, resolveNavGroup, resolveNavItem);
  const rail = variant === "rail";

  return (
    <Box component="nav" aria-label="القائمة الرئيسية" sx={{ py: 1 }}>
      {groups.map((group, gi) => (
        <Box key={group.key}>
          {gi > 0 && <Divider sx={{ my: 0.5 }} />}
          <List
            dense
            disablePadding
            subheader={
              rail ? null : (
                <ListSubheader
                  disableSticky
                  sx={{
                    bgcolor: "transparent",
                    color: "text.secondary",
                    fontWeight: 700,
                    lineHeight: "32px",
                  }}
                >
                  {group.label}
                </ListSubheader>
              )
            }
          >
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isPathActive(pathname, item.href);
              const button = (
                <ListItemButton
                  component={NextLink}
                  href={item.href}
                  selected={active}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  sx={{
                    borderRadius: 2,
                    mx: rail ? 0.5 : 1,
                    my: 0.25,
                    justifyContent: rail ? "center" : "flex-start",
                    minHeight: 44, // ≥24px target (a11y 2.5.8)
                    "&.Mui-selected": {
                      bgcolor: "action.selected",
                      "& .MuiListItemIcon-root svg": { color: "primary.main" },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{ minWidth: rail ? 0 : 40, justifyContent: "center" }}
                  >
                    <Icon size={20} />
                  </ListItemIcon>
                  {!rail && <ListItemText primary={item.label} />}
                </ListItemButton>
              );
              return rail ? (
                <Tooltip key={item.key} title={item.label} placement="left">
                  {button}
                </Tooltip>
              ) : (
                <Box key={item.key}>{button}</Box>
              );
            })}
          </List>
        </Box>
      ))}
    </Box>
  );
}

export default SideNav;
