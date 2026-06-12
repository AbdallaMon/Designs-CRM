"use client";

// Project-group picker for the create-contract flow. Reads the unique project groups for a
// lead via the contracts service (→ GET /v2/projects/:leadId/groups, gated server-side on
// project.list + lead scope). Ported from the legacy ProjectGroupSelect, Arabic-only.

import { useEffect, useState } from "react";
import { FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip, Stack, LinearProgress, useTheme } from "@mui/material";
import { FaSync } from "react-icons/fa";
import { useT } from "@/app/v2/lib/i18n";
import contractsService from "../../../contracts.service.js";

export default function ProjectGroupSelect({ clientLeadId, value, onChange, disabled }) {
  const { t } = useT();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);

  const fetchGroups = async () => {
    if (!clientLeadId) return;
    setLoading(true);
    try {
      const res = await contractsService.getProjectGroups(clientLeadId);
      setGroups(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientLeadId]);

  return (
    <Stack direction="row" spacing={1} alignItems="flex-end" flex={1}>
      <FormControl fullWidth disabled={loading || disabled} size="small">
        <InputLabel id="project-group-label">{t("contracts.editors.projectGroup.label")}</InputLabel>
        <Select
          labelId="project-group-label"
          label={t("contracts.editors.projectGroup.label")}
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
      <Tooltip title={t("contracts.editors.projectGroup.reload")}>
        <span>
          <IconButton onClick={fetchGroups} disabled={loading || disabled} size="small">
            {loading ? <LinearProgress sx={{ width: 24 }} /> : <FaSync style={{ color: theme.palette.text.secondary }} />}
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
