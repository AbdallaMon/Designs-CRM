"use client";

// Staff "admin booking" tab — pick an admin, then manage that admin's availability.
// Behavior PRESERVED from the legacy StaffCalendar `StaffAdminCalendar` (admins list via
// /v2/utilities/users/admins; the panel is mounted once an admin is selected, type="STAFF").

import { useState } from "react";
import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useAdmins } from "../hooks/useAdmins.js";
import AdminBookingPanel from "./AdminBookingPanel.jsx";

export function StaffAdminSelector({ timezone, canManage = false }) {
  const [adminId, setAdminId] = useState("");
  const { admins, isLoading } = useAdmins();

  return (
    <>
      <FormControl fullWidth>
        <InputLabel id="admin-select-label">اختر المسؤول *</InputLabel>
        <Select
          labelId="admin-select-label"
          value={adminId || ""}
          label="اختر المسؤول *"
          onChange={(e) => setAdminId(e.target.value)}
          disabled={isLoading}
          sx={{ borderRadius: 2 }}
        >
          {isLoading ? (
            <MenuItem disabled>
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} /> جاري التحميل...
              </Box>
            </MenuItem>
          ) : (
            admins.map((admin) => (
              <MenuItem key={admin.id} value={admin.id}>
                <Box>
                  <Typography variant="body1">{admin.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {admin.email}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {adminId && (
        <Box mt={3}>
          <AdminBookingPanel
            type="STAFF"
            adminId={adminId}
            timezone={timezone}
            canManage={canManage}
            title="إدارة توفر المسؤول"
          />
        </Box>
      )}
    </>
  );
}

export default StaffAdminSelector;
