"use client";

// Staff-user pick-list, reused by the Reports tab (report `userIds[]` filter) and the
// Commissions tab (the required `userId`). Fetches GET /v2/users/all-users?role=STAFF via the
// SOLE adminResidual service (never fetch directly). Supports single OR multiple selection.
// Arabic / RTL. Fails soft to an empty list if the caller lacks user.list (the BE enforces).

import { useEffect, useState } from "react";
import {
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import { adminResidualService } from "../adminResidual.service.js";

export function StaffUserPicker({
  multiple = false,
  value,
  onChange,
  label = "الموظف",
  disabled = false,
}) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      try {
        const res = await adminResidualService.getStaffUsers();
        const items = Array.isArray(res?.data?.items)
          ? res.data.items
          : Array.isArray(res?.data)
            ? res.data
            : [];
        if (active) setUsers(items);
      } catch {
        if (active) setUsers([]);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const nameById = (id) => users.find((u) => String(u.id) === String(id))?.name ?? `#${id}`;
  const selectValue = multiple ? (Array.isArray(value) ? value : []) : (value ?? "");

  return (
    <FormControl fullWidth size="small" disabled={disabled || isLoading}>
      <InputLabel id="staff-picker-label">{label}</InputLabel>
      <Select
        labelId="staff-picker-label"
        multiple={multiple}
        value={selectValue}
        onChange={(e) => onChange?.(e.target.value)}
        input={<OutlinedInput label={label} />}
        renderValue={
          multiple
            ? (selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((id) => (
                    <Chip key={id} size="small" label={nameById(id)} />
                  ))}
                </Box>
              )
            : undefined
        }
      >
        {isLoading && (
          <MenuItem disabled>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} /> جاري التحميل...
            </Box>
          </MenuItem>
        )}
        {!isLoading && users.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              لا يوجد موظفون
            </Typography>
          </MenuItem>
        )}
        {!isLoading &&
          users.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              {multiple && <Checkbox checked={selectValue.indexOf(u.id) > -1} />}
              <ListItemText
                primary={u.name}
                secondary={u.email}
                secondaryTypographyProps={{ variant: "caption" }}
              />
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
}

export default StaffUserPicker;
