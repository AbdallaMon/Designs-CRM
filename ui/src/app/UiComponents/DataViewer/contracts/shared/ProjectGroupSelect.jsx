"use client";

import React, { useEffect, useState } from "react";
import {
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  LinearProgress,
  useTheme,
} from "@mui/material";
import { FaSync } from "react-icons/fa";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";

export default function ProjectGroupSelect({
  clientLeadId,
  value,
  onChange,
  disabled,
}) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);

  const fetchGroups = async () => {
    const req = await getDataAndSet({
      url: `shared/projects/${clientLeadId}/groups`,
      setData: setGroups,
      setLoading,
    });
  };

  useEffect(() => {
    if (clientLeadId) fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientLeadId]);

  return (
    <Stack direction="row" spacing={1} alignItems="flex-end" flex={1}>
      <FormControl fullWidth disabled={loading || disabled} size="small">
        <InputLabel id="project-group-label">Project Group</InputLabel>
        <Select
          labelId="project-group-label"
          label="Project Group"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
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
