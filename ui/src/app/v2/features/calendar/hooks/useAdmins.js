"use client";

// Fetches the admins list for the staff "admin booking" tab (selecting whose availability
// to manage). Mirrors the legacy StaffCalendar `shared/utilities/users/admins` call →
// /v2/utilities/users/admins. Returns [] gracefully if the caller lacks utility.admin.list
// (the legacy staff/super-sales roles held that access; this preserves the screen behavior
// without coupling the calendar feature to that permission code in the UI gate).

import { useEffect, useState } from "react";
import apiFetch from "@/app/v2/lib/api/ApiFetch";

export function useAdmins({ enabled = true } = {}) {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    (async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch.get("utilities/users/admins");
        if (active) setAdmins(Array.isArray(res?.data) ? res.data : []);
      } catch {
        if (active) setAdmins([]);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [enabled]);

  return { admins, isLoading };
}
