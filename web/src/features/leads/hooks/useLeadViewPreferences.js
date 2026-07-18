"use client";
// Remembered UI preferences for the lead/deal detail view, persisted per-browser in
// localStorage (mirrors the dashboard sidenav's "sidenav-collapsed" pattern — there is
// no backend user-settings API). Both keys default to false and are read on mount (so
// the server render is stable and there's no hydration mismatch). Because they read a
// shared key rather than instance state, any lead opened afterward restores the same
// mode — the toggles behave as a global default for the lead view.
import { useEffect, useState } from "react";

export const LEAD_FULLSCREEN_KEY = "lead-view-fullscreen";
export const LEAD_RAIL_COLLAPSED_KEY = "lead-tabs-collapsed";
// Whether the cockpit strip's lower-priority (collapsed) suggestions are expanded.
// Global like the others — but safe as a default because criticals + the top-ranked row
// are ALWAYS rendered regardless of this pref, so it can never hide something urgent.
export const LEAD_COCKPIT_EXPANDED_KEY = "lead-cockpit-expanded";

function readBool(key) {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(key);
  return stored == null ? null : stored === "true";
}

function writeBool(key, value) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, String(value));
  }
}

// Accepts an explicit boolean, or toggles when called with no/other argument.
function makeSetter(key, setState) {
  return (next) =>
    setState((prev) => {
      const value = typeof next === "boolean" ? next : !prev;
      writeBool(key, value);
      return value;
    });
}

export function useLeadViewPreferences() {
  const [fullscreen, setFullscreenState] = useState(false);
  const [railCollapsed, setRailCollapsedState] = useState(false);
  const [cockpitExpanded, setCockpitExpandedState] = useState(false);

  useEffect(() => {
    const fs = readBool(LEAD_FULLSCREEN_KEY);
    if (fs != null) setFullscreenState(fs);
    const rc = readBool(LEAD_RAIL_COLLAPSED_KEY);
    if (rc != null) setRailCollapsedState(rc);
    const ce = readBool(LEAD_COCKPIT_EXPANDED_KEY);
    if (ce != null) setCockpitExpandedState(ce);
  }, []);

  return {
    fullscreen,
    setFullscreen: makeSetter(LEAD_FULLSCREEN_KEY, setFullscreenState),
    railCollapsed,
    setRailCollapsed: makeSetter(LEAD_RAIL_COLLAPSED_KEY, setRailCollapsedState),
    cockpitExpanded,
    setCockpitExpanded: makeSetter(LEAD_COCKPIT_EXPANDED_KEY, setCockpitExpandedState),
  };
}
