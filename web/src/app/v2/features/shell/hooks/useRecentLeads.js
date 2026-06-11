"use client";

// useRecentLeads — a lightweight "recently-viewed leads" list backed by localStorage.
// No data fetch, no auth: it simply mirrors whatever the app records via pushRecentLead.
// Shape stored: [{ id, name }] most-recent-first, deduped by id, capped at MAX. Every read
// path degrades to an empty array (SSR / private-mode / corrupt JSON) so callers can render
// nothing without guarding. Single-language Arabic / RTL surface lives in the consumer.

import { useEffect, useState } from "react";

const STORAGE_KEY = "recentLeads";
const MAX = 5;

// Read + normalize the stored list. Returns [] on any failure (no window, bad JSON, wrong shape).
function readRecentLeads() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && x.id != null)
      .map((x) => ({ id: x.id, name: x.name ?? "" }))
      .slice(0, MAX);
  } catch {
    return [];
  }
}

// Prepend a lead to the recent list (dedupe by id, cap at MAX), then persist. Safe to call from
// anywhere on the client; a no-op when there's no window or no id. Notifies same-tab listeners
// via a custom event so an already-mounted useRecentLeads() refreshes without a reload.
export function pushRecentLead(lead) {
  if (typeof window === "undefined" || !lead || lead.id == null) return;
  try {
    const entry = { id: lead.id, name: lead.name ?? "" };
    const prev = readRecentLeads().filter((x) => x.id !== entry.id);
    const next = [entry, ...prev].slice(0, MAX);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("recentLeads:changed"));
  } catch {
    // private mode / quota — silently ignore; the read side just keeps the prior list.
  }
}

// Read API — returns the current recent leads and stays in sync with same-tab pushes and
// cross-tab storage events. Empty array until hydrated (SSR-safe).
export function useRecentLeads() {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const refresh = () => setRecent(readRecentLeads());
    refresh();
    window.addEventListener("recentLeads:changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("recentLeads:changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return recent;
}

export default useRecentLeads;
