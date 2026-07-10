"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { FaSync } from "react-icons/fa";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";

// keep your existing helper import (same one used in your single select)

export default function ProjectGroupMultiSelect({
  clientLeadId,
  value,
  onChange,
  disabled,
}) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  console.log(groups, "groups");
  const fetchGroups = async () => {
    await getDataAndSet({
      url: `shared/projects/${clientLeadId}/groups`,
      setData: setGroups,
      setLoading,
    });
  };

  useEffect(() => {
    if (clientLeadId) fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientLeadId]);

  const groupById = useMemo(() => {
    const m = new Map();
    (groups || []).forEach((g) => m.set(g.groupId, g));
    return m;
  }, [groups]);

  const safeValue = Array.isArray(value) ? value : [];

  return (
    <Stack direction="row" spacing={1} alignItems="flex-end" flex={1}>
      <FormControl fullWidth disabled={loading || disabled} size="small">
        <InputLabel id="project-group-multi-label">Project Groups</InputLabel>

        <Select
          multiple
          displayEmpty
          labelId="project-group-multi-label"
          label="Project Groups"
          value={safeValue}
          onChange={(e) => {
            const v = e.target.value;

            // MUI can return string in some autofill cases
            const next = typeof v === "string" ? v.split(",") : v;

            // keep IDs as numbers when possible
            const normalized = (next || [])
              .map((x) => (typeof x === "string" ? Number(x) : x))
              .filter((x) => Number.isFinite(x));

            onChange(normalized);
          }}
          renderValue={(selected) => {
            if (!selected?.length) {
              return (
                <Typography variant="body2" sx={{ opacity: 0.65 }}>
                  Select one or more groups
                </Typography>
              );
            }

            return (
              <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                {selected.map((id) => {
                  const g = groupById.get(id);
                  const label = g
                    ? `${g.groupTitle} — #${g.groupId}`
                    : `#${id}`;
                  return (
                    <Chip
                      key={id}
                      size="small"
                      label={label}
                      sx={{ fontWeight: 700 }}
                    />
                  );
                })}
              </Stack>
            );
          }}
          MenuProps={{
            PaperProps: { sx: { maxHeight: 360 } },
          }}
        >
          {(groups || []).map((group) => (
            <MenuItem key={group.groupId} value={group.groupId}>
              {group.groupTitle} — #{group.groupId}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Tooltip title="Reload groups">
        <span>
          <IconButton
            onClick={fetchGroups}
            disabled={loading || disabled}
            size="small"
          >
            {loading ? (
              <LinearProgress sx={{ width: 24 }} />
            ) : (
              <FaSync style={{ color: theme.palette.text.secondary }} />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
