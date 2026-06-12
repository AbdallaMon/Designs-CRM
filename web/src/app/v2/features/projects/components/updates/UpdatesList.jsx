"use client";

// Updates list for a lead — migrated from the legacy UpdatesList. GET /v2/updates/:clientLeadId
// (the BE narrows the rows by role/self; `type` = the caller's department + `department`
// filter travel as top-level query params via `extra`). Each card carries the workflow
// actions, capability-gated. Create is gated on PERMISSIONS.UPDATE.CREATE.

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { useT } from "@/app/v2/lib/i18n";
import { DEPARTMENTS } from "../../config/projectsConstants.js";
import { projectsService } from "../../projects.service.js";
import { UpdateCard } from "./UpdateCard.jsx";
import { CreateUpdateModal } from "./CreateUpdateModal.jsx";

dayjs.extend(relativeTime);

function isAdminUser(user) {
  return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || Boolean(user?.isSuperSales);
}

export function UpdatesList({ clientLeadId, currentUserDepartment = "STAFF" }) {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { t } = useT();
  const isAdmin = isAdminUser(user);
  const canList = hasPermission(PERMISSIONS.UPDATE.LIST);
  const canCreate = hasPermission(PERMISSIONS.UPDATE.CREATE);

  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("notArchived");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await projectsService.listUpdates(clientLeadId, {
        extra: { type: currentUserDepartment, department: departmentFilter },
      });
      setUpdates(Array.isArray(res?.data?.items) ? res.data.items : Array.isArray(res?.data) ? res.data : []);
    } catch {
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientLeadId && canList) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientLeadId, departmentFilter, canList]);

  const visible = useMemo(() => {
    return (updates || []).filter((update) => {
      const shared = update.sharedSettings ?? [];
      const isArchived = shared.length > 0 && shared.every((s) => s.isArchived);
      if (filter === "archived") return isArchived;
      if (filter === "notArchived") return !isArchived;
      return true;
    });
  }, [updates, filter]);

  if (!canList) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">{t("projects.updates.denied")}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          {t("projects.updates.title")}
        </Typography>
        {canCreate && (
          <CreateUpdateModal
            clientLeadId={clientLeadId}
            currentUserDepartment={currentUserDepartment}
            onCreated={load}
          />
        )}
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <Stack direction="row" spacing={1}>
            {[
              { value: "all", label: t("projects.updates.filter.all") },
              { value: "notArchived", label: t("projects.updates.filter.active") },
              { value: "archived", label: t("projects.updates.filter.archived") },
            ].map((opt) => (
              <Button
                key={opt.value}
                variant={filter === opt.value ? "contained" : "outlined"}
                onClick={() => setFilter(opt.value)}
                size="small"
              >
                {opt.label}
              </Button>
            ))}
          </Stack>
          {isAdmin && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>{t("projects.updates.filterByDepartment")}</InputLabel>
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                label={t("projects.updates.filterByDepartment")}
              >
                <MenuItem value="">{t("projects.updates.allDepartments")}</MenuItem>
                {DEPARTMENTS.map((d) => (
                  <MenuItem key={d.value} value={d.value}>
                    {d.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
      </Paper>

      {loading ? (
        <Typography>{t("projects.updates.loading")}</Typography>
      ) : visible.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary">
            {t("projects.updates.empty")}
          </Typography>
        </Paper>
      ) : (
        visible.map((update) => (
          <UpdateCard
            key={update.id}
            update={update}
            clientLeadId={clientLeadId}
            currentUserDepartment={currentUserDepartment}
            onChanged={load}
          />
        ))
      )}
    </Container>
  );
}

export default UpdatesList;
