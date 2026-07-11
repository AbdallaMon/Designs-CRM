# Lead View — Fullscreen Toggle & Collapsible Tab Rail

**Date:** 2026-07-11
**Branch:** `feat/audit-log-sales-admin`
**Scope:** Frontend only (`web/`). No backend, no schema, no API changes.

## 1. Problem / Goal

When a user opens a lead's details, the view is a fixed-size MUI `Dialog` (`maxWidth="lg"`, `92vh`) with a fixed 256px vertical tab rail. Two ergonomics gaps:

1. **No way to give the lead more room.** Power users working a deal want the lead edge-to-edge (fullscreen), and want that choice to *stick* — so every lead they open afterward opens the same way, without re-toggling.
2. **The tab rail is always full-width.** On smaller screens or when focused on content, users want to collapse the rail to an icons-only strip (like the dashboard side nav), keeping labels available on hover via tooltips.

Both are **remembered preferences**: once set, the next lead opened restores the same mode.

## 2. Non-Goals

- No backend user-settings/preferences API. Persistence is per-browser `localStorage` only (matching the existing `sidenav-collapsed` pattern). Cross-device sync is explicitly out of scope.
- No change to the tab/section registry, data fetching, permissions, or which sections are visible.
- No change to the full-page route's existence or the "Open in new tab" behavior.
- No mobile (`xs`) redesign — the horizontal chip scroller stays as-is.

## 3. Current State (verified)

- `web/src/features/leads/features/PreviewLead.jsx` — owns the `<Dialog>` (modal mode, `page=false`) vs full-page `<Container>` (`page=true`, route `/dashboard/deals/[id]`). Sets `fullScreen={isMobile}` automatically; no user toggle.
- `web/src/features/leads/shared/LeadDialogHeader.jsx` — header action bar; already has an "Open in new tab" `IconButton` shown only when `!isPage`.
- `web/src/features/leads/LeadWorkspace.jsx` — renders the tab rail: vertical grouped rail (`width: 256`) on `md+`, horizontal chip scroller on `xs`. Each `NavItem` has icon + label + count `<Badge>`.
- Preference-persistence precedent: `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx` uses `localStorage` key `"sidenav-collapsed"` with a mount-time read `useEffect` + a setter that writes `String(value)`. There is **no** generic preferences hook or backend settings API.

## 4. Design

### 4.1 Preference hook (new)

**File:** `web/src/features/leads/hooks/useLeadViewPreferences.js`

A small, SSR-safe hook owning two boolean `localStorage` keys:

- `LEAD_FULLSCREEN_KEY = "lead-view-fullscreen"`
- `LEAD_RAIL_COLLAPSED_KEY = "lead-tabs-collapsed"`

Behavior (mirrors the `sidenav-collapsed` pattern exactly):

- Initial state defaults to `false` (server render safe — avoids hydration mismatch).
- On mount, a `useEffect` reads each key from `window.localStorage` (guarded by `typeof window !== "undefined"`); if present, sets state from `stored === "true"`.
- Setters accept an optional explicit boolean or toggle when omitted; each writes `String(value)` back to `localStorage` before returning.

Returns: `{ fullscreen, setFullscreen, railCollapsed, setRailCollapsed }`.

Because the hook reads a shared `localStorage` key rather than instance state, any lead opened afterward reads the same value — the mode is effectively a global default for the lead view.

### 4.2 Fullscreen toggle

**`PreviewLead.jsx`:**

- Consume `useLeadViewPreferences()` for `fullscreen` / `setFullscreen`.
- Modal mode: `fullScreen={isMobile || fullscreen}`. When `fullscreen` and not mobile, the dialog goes edge-to-edge; otherwise unchanged (`maxWidth="lg"`, `92vh` card).
- Pass `fullscreen` + `onToggleFullscreen` down to `LeadDialogHeader` (only relevant in modal mode).
- Full-page mode: fullscreen is meaningless; no toggle wired.

**`LeadDialogHeader.jsx`:**

- Add a toggle `IconButton` in the action bar next to "Open in new tab", rendered only when `!isPage`.
- Icon reflects state: an "enter fullscreen" (expand) icon when normal, an "exit fullscreen" (contract) icon when fullscreen, each wrapped in a `<Tooltip>` ("Fullscreen" / "Exit fullscreen"). Use icons consistent with the existing react-icons set already imported in this file.

### 4.3 Collapsible tab rail

**`LeadWorkspace.jsx`:**

- Consume `useLeadViewPreferences()` for `railCollapsed` / `setRailCollapsed`.
- `md+` only: add a collapse/expand toggle control at the top of the rail.
- When `railCollapsed`:
  - Rail width shrinks from `256` to a slim strip (~`64`).
  - Group-header text and each item's text label are hidden; only the icon shows.
  - Each `NavItem` icon is wrapped in a MUI `<Tooltip title={label} placement="right">` so hovering reveals the name (matching the side-nav collapsed behavior).
  - The count still surfaces as a small `<Badge variant="dot">` on the icon so the "has items" signal is not lost.
- `xs` (horizontal chip scroller): unaffected — collapse control not shown, behavior unchanged.
- State persists via the shared hook, so a collapsed rail also carries to the next lead opened.

## 5. Components / Data Flow

```
useLeadViewPreferences (localStorage: lead-view-fullscreen, lead-tabs-collapsed)
        │  fullscreen / setFullscreen                 railCollapsed / setRailCollapsed
        ▼                                                     ▼
PreviewLead.jsx ──fullScreen prop──▶ <Dialog>          LeadWorkspace.jsx (rail width, tooltips, badges)
        │
        └─ fullscreen + onToggleFullscreen ─▶ LeadDialogHeader.jsx (toggle IconButton, modal-only)
```

Both `PreviewLead` (for fullscreen) and `LeadWorkspace` (for rail) call the hook independently; they share state through the common `localStorage` keys, not through props threading between them.

## 6. Testing / Verification

- Manual: open a lead from a list → toggle fullscreen → close → open another lead → it opens fullscreen. Toggle off → next lead opens normal. Repeat for rail collapse (collapse → reopen → still collapsed; hover icon → tooltip shows label; count dot present when the tab has items).
- Full-page route: fullscreen toggle absent; rail collapse still works and persists.
- Mobile (`xs`): dialog still auto-fullscreens; no rail collapse control; chip scroller unchanged.
- Verify FE builds with `cd web && npx next build` (web eslint config is known-broken; build is the check).

## 7. Risks

- **Hydration mismatch** if state were read during render — avoided by defaulting to `false` and reading in a mount `useEffect`, exactly as `sidenav-collapsed` does.
- **Fullscreen + full-page confusion** — mitigated by hiding the fullscreen toggle in page mode.
- Low blast radius: three existing files touched + one new hook; no shared/global component changes.
