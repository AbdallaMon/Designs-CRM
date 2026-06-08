"use client";

// <UrlTabs /> — the canonical URL-synced tab pattern extracted from LeadDetailsPage (`?tab=`)
// and AccountingPage (`?view=`). The active tab lives in the URL query param so deep-links and
// browser back/forward work; the tab SET is whatever the CALLER passes (already filtered by
// permission/capability — same predicate that gates each tab's content). The caller renders the
// active panel itself (this component owns the strip + the URL sync only). Single-language
// Arabic / RTL (MUI Tabs mirror automatically under the rtl cache).
//
// Props:
//   tabs       { key, label, count? }[] — the permission-filtered tab set (order = display).
//   param      string  — the query-string key to sync (default "tab"; accounting uses "view").
//   activeKey  string? — controlled active key; if omitted, derived from the URL (or tabs[0]).
//   onChange   (key) => void? — optional extra callback when the active tab changes.
//   children   (activeKey) => node | node — render-prop (gets the resolved active key) or node.
//   variant/scrollButtons — passed through to MUI Tabs (defaults scrollable/auto).

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Tab, Tabs, Badge } from "@mui/material";

export function UrlTabs({
  tabs = [],
  param = "tab",
  activeKey,
  onChange,
  children,
  variant = "scrollable",
  scrollButtons = "auto",
  sx,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const keys = useMemo(() => tabs.map((t) => t.key), [tabs]);

  const resolved = useMemo(() => {
    if (activeKey && keys.includes(activeKey)) return activeKey;
    const requested = sp.get(param);
    return keys.includes(requested) ? requested : keys[0];
  }, [activeKey, keys, sp, param]);

  const select = useCallback(
    (key) => {
      const params = new URLSearchParams(sp.toString());
      params.set(param, key);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      onChange?.(key);
    },
    [sp, param, router, pathname, onChange],
  );

  if (tabs.length === 0) return null;

  return (
    <Box>
      <Tabs
        value={resolved}
        onChange={(_e, key) => select(key)}
        variant={variant}
        scrollButtons={scrollButtons}
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: "divider", ...sx }}
      >
        {tabs.map((t) => (
          <Tab
            key={t.key}
            value={t.key}
            label={
              t.count != null ? (
                <Badge color="primary" badgeContent={t.count} sx={{ pe: 1.5 }}>
                  <span>{t.label}</span>
                </Badge>
              ) : (
                t.label
              )
            }
          />
        ))}
      </Tabs>
      <Box sx={{ pt: 2 }}>
        {typeof children === "function" ? children(resolved) : children}
      </Box>
    </Box>
  );
}

export default UrlTabs;
