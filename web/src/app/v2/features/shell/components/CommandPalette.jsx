"use client";

// <CommandPalette /> — the ⌘K / Ctrl+K command surface of the new shell. A MUI <Dialog> (Grow
// transition) opened by the CommandBar trigger AND by a global ⌘K/Ctrl+K keydown listener.
// Contents:
//   • the existing <LeadSearchAutocomplete> to jump to a lead (/v2/leads/{id}),
//   • a filterable list of nav destinations (from buildWorkspaceNav, permission-gated) to jump
//     to any page the user can reach.
// Closes on select / navigate / Esc. RTL-correct. Theme tokens only. Single-language Arabic.

import { useEffect, useMemo, useState, forwardRef } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Grow,
  TextField,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useMediaQuery,
} from "@mui/material";
import { MdBolt } from "react-icons/md";
import { useRouter } from "next/navigation";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { LeadSearchAutocomplete } from "@/app/v2/features/leads/components/LeadSearchAutocomplete";
import { buildWorkspaceNav } from "../nav.config";
import { resolveNavItem, resolveWorkspaceLabel } from "../navLabels";

const GrowTransition = forwardRef(function GrowTransition(props, ref) {
  return <Grow ref={ref} timeout={220} {...props} />;
});

export function CommandPalette({ open, onClose }) {
  const router = useRouter();
  const perm = usePermission();
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );
  const canSearchLeads = perm.hasPermission(PERMISSIONS.LEAD.LIST);

  const [query, setQuery] = useState("");

  // Flat, permission-filtered destination list with its workspace label for grouping context.
  const destinations = useMemo(() => {
    const nav = buildWorkspaceNav(perm, resolveNavItem);
    return nav.flatMap(({ workspace, items }) =>
      items.map((it) => ({
        ...it,
        workspaceLabel: resolveWorkspaceLabel(workspace.key),
      })),
    );
  }, [perm]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter(
      (d) =>
        d.label.toLowerCase().includes(q) ||
        d.workspaceLabel.toLowerCase().includes(q) ||
        d.href.toLowerCase().includes(q),
    );
  }, [destinations, query]);

  // Top global ACTIONS (audit H5) — the palette now does more than navigate-by-name: it offers a
  // small, honest set of real commands that route straight to the relevant screen. Each is
  // permission-gated and only routes to a genuinely-working destination (no dead create flags).
  const commands = useMemo(() => {
    const list = [];
    if (perm.hasPermission(PERMISSIONS.LEAD.LIST)) {
      list.push({
        key: "cmd-cockpit",
        label: "مساحة عملي",
        hint: "مهامك اليومية",
        href: "/v2/leads/workspace",
      });
      list.push({
        key: "cmd-leads",
        label: "قائمة العملاء",
        hint: "البحث في كل العملاء",
        href: "/v2/leads",
      });
    }
    return list;
  }, [perm]);

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.hint || "").toLowerCase().includes(q),
    );
  }, [commands, query]);

  // Reset the query each time the palette opens.
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const goToLead = (lead) => {
    if (lead?.id == null) return;
    onClose?.();
    router.push(`/v2/leads/${lead.id}`);
  };

  const goToDestination = (href) => {
    onClose?.();
    router.push(href);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      dir="rtl"
      TransitionComponent={prefersReducedMotion ? undefined : GrowTransition}
      transitionDuration={prefersReducedMotion ? 0 : 220}
      aria-label="لوحة الأوامر"
      sx={{ "& .MuiDialog-paper": { borderRadius: 3 } }}
    >
      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {canSearchLeads && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="overline"
              sx={{ display: "block", mb: 0.5, color: "text.secondary" }}
            >
              الانتقال إلى عميل
            </Typography>
            <LeadSearchAutocomplete onSelect={goToLead} />
          </Box>
        )}

        {canSearchLeads && <Divider sx={{ my: 1.5 }} />}

        {/* أوامر — top global actions (audit H5). Honest, permission-gated, route to a real
            screen. Hidden when filtered out by the query. */}
        {filteredCommands.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="overline"
              sx={{ display: "block", mb: 0.5, color: "text.secondary" }}
            >
              أوامر
            </Typography>
            <List dense disablePadding>
              {filteredCommands.map((c) => (
                <ListItemButton
                  key={c.key}
                  onClick={() => goToDestination(c.href)}
                  sx={{ borderRadius: 2, minHeight: 44 }}
                >
                  <ListItemIcon sx={{ minWidth: 36, justifyContent: "center" }}>
                    <MdBolt size={18} />
                  </ListItemIcon>
                  <ListItemText
                    primary={c.label}
                    secondary={c.hint}
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItemButton>
              ))}
            </List>
            <Divider sx={{ mt: 1.5 }} />
          </Box>
        )}

        <Typography
          variant="overline"
          sx={{ display: "block", mb: 0.5, color: "text.secondary" }}
        >
          الانتقال إلى صفحة
        </Typography>
        <TextField
          fullWidth
          size="small"
          autoFocus={!canSearchLeads}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث في الصفحات…"
          sx={{ mb: 1 }}
        />
        <List dense disablePadding sx={{ maxHeight: 320, overflowY: "auto" }}>
          {filtered.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ px: 2, py: 1.5 }}
            >
              لا توجد نتائج
            </Typography>
          )}
          {filtered.map((d) => {
            const Icon = d.icon;
            return (
              <ListItemButton
                key={d.key}
                onClick={() => goToDestination(d.href)}
                sx={{ borderRadius: 2, minHeight: 44 }}
              >
                {Icon && (
                  <ListItemIcon sx={{ minWidth: 36, justifyContent: "center" }}>
                    <Icon size={18} />
                  </ListItemIcon>
                )}
                <ListItemText
                  primary={d.label}
                  secondary={d.workspaceLabel}
                  primaryTypographyProps={{ variant: "body2" }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </DialogContent>
    </Dialog>
  );
}

export default CommandPalette;
