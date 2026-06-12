"use client";

// Utilities FOUNDATION page — a wiring smoke-screen, NOT a redesigned screen (these are
// cross-cutting lookup helpers consumed by OTHER features, not a standalone end-user screen).
// It proves the v2 data layer is wired end-to-end: permission-gated on utility.fixed_data.list,
// it fetches fixed-data through useRequest → the utilities.service (the SOLE API caller, pointed
// at /v2/utilities). It also proves the §5c model pick-list contract: when utility.model.read is
// granted it reads a `colorPattern` pick-list and renders the label via readModelLabel(), which
// handles the new fixed projections (relation title[0].text vs scalar title vs imageUrl). The
// real consumers wire these helpers into their own screens later. Single-language Arabic/RTL.

import { useCallback, useEffect, useState } from "react";
import { Box, Container, List, ListItem, ListItemText, Paper, Typography } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { FIXED_DATA_URL, UTILITY_MODELS } from "../config/constant.js";
import { utilitiesService, readModelLabel } from "../utilities.service.js";

const P = PERMISSIONS.UTILITY;

export function UtilitiesPage() {
  const { hasPermission } = usePermission();
  const canFixedData = hasPermission(P.FIXED_DATA_LIST);
  const canModelRead = hasPermission(P.MODEL_READ);

  // Primary read proves the wiring (fixed-data is the simplest authed lookup).
  const { data: fixedData, isLoading, error } = useRequest({
    url: FIXED_DATA_URL,
    method: "get",
    autoFetch: canFixedData,
  });

  // Secondary read proves the §5c model pick-list projection + readModelLabel().
  const [picks, setPicks] = useState([]);
  const loadPicks = useCallback(async () => {
    if (!canModelRead) return;
    const res = await utilitiesService.getModel(UTILITY_MODELS.COLOR_PATTERN);
    setPicks(Array.isArray(res?.data) ? res.data : []);
  }, [canModelRead]);
  useEffect(() => {
    loadPicks();
  }, [loadPicks]);

  if (!canFixedData && !canModelRead) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Typography color="text.secondary">لا تملك صلاحية الوصول إلى الأدوات المساعدة</Typography>
      </Box>
    );
  }

  const fixedItems = Array.isArray(fixedData) ? fixedData : [];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        الأدوات المساعدة
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        أساس البيانات جاهز — تستهلكه الميزات الأخرى لاحقاً في مرحلة إعادة التصميم.
      </Typography>

      {canFixedData && (
        <Paper variant="outlined" sx={{ mb: 3 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="subtitle1">البيانات الثابتة</Typography>
          </Box>
          {isLoading && <Box sx={{ p: 2 }}><Typography color="text.secondary">جاري التحميل...</Typography></Box>}
          {error && <Box sx={{ p: 2 }}><Typography color="error">تعذّر جلب البيانات</Typography></Box>}
          {!isLoading && !error && (
            <List disablePadding>
              {fixedItems.length === 0 && (
                <ListItem><ListItemText primary="لا توجد بيانات" /></ListItem>
              )}
              {fixedItems.map((it, i) => (
                <ListItem key={it?.id ?? i} divider>
                  <ListItemText primary={it?.title || `#${it?.id ?? i}`} />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

      {canModelRead && (
        <Paper variant="outlined">
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="subtitle1">قائمة الألوان (نموذج pick-list)</Typography>
          </Box>
          <List disablePadding>
            {picks.length === 0 && (
              <ListItem><ListItemText primary="لا توجد عناصر" /></ListItem>
            )}
            {picks.map((row, i) => (
              <ListItem key={row?.id ?? i} divider>
                <ListItemText
                  primary={readModelLabel(UTILITY_MODELS.COLOR_PATTERN, row) || `#${row?.id ?? i}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
}

export default UtilitiesPage;
