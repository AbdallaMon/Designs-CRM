"use client";

// Questions foundation panel — a THIN, LEAD-SCOPED wiring smoke-screen (NOT the redesigned
// session-questions / VERSA UI; those land in the UX-redesign phase). It proves the v2 data
// layer is wired end-to-end: takes a `leadId`, fetches that lead's question-type config via
// useRequest → questionsService → apiFetch (/v2/questions), and renders the primary data,
// permission-gated on QUESTION.CONFIG_VIEW. Single Arabic/RTL.
//
// LEAD-SCOPED: questions reads/writes are scoped to a parent ClientLead; the BE enforces the
// lead object-scope per record (the dtos emit NO capabilities.*), so we gate on the
// QUESTION.* CODES only — the server is the source of truth.

import { Box, Container, Typography, CircularProgress, Alert } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { useT } from "@/app/v2/lib/i18n";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { questionTypesUrl } from "../config/constant.js";

const P = PERMISSIONS.QUESTION;

export function QuestionsPanel({ leadId }) {
  const { t } = useT();
  const { hasPermission } = usePermission();
  const canViewConfig = hasPermission(P.CONFIG_VIEW);

  const hasLead = Boolean(leadId);
  const { data, isLoading, error } = useRequest({
    url: hasLead ? questionTypesUrl(leadId) : "",
    method: "get",
    autoFetch: canViewConfig && hasLead,
  });

  if (!canViewConfig) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          {t("questions.noViewPermission", "لا تملك صلاحية عرض أسئلة العميل")}
        </Alert>
      </Container>
    );
  }

  const types = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {t("questions.title", "أسئلة العميل")}
      </Typography>

      {!hasLead && (
        <Alert severity="info">
          {t("questions.selectLeadHint", "حدد عميلاً (leadId) لعرض أنواع الأسئلة الخاصة به.")}
        </Alert>
      )}

      {hasLead && isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {hasLead && !isLoading && error && (
        <Alert severity="error">{t("questions.fetchTypesError", "تعذر جلب أنواع الأسئلة.")}</Alert>
      )}

      {hasLead && !isLoading && !error && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t("questions.typesCount", "أنواع الأسئلة ({count})").replace(
              "{count}",
              types.length,
            )}
          </Typography>
          {types.length === 0 ? (
            <Typography color="text.secondary">
              {t("questions.noTypes", "لا توجد أنواع أسئلة.")}
            </Typography>
          ) : (
            types.map((t) => (
              <Box
                key={t.id ?? t.key ?? t.title}
                sx={{ p: 1.5, mb: 1, border: 1, borderColor: "divider", borderRadius: 1 }}
              >
                <Typography>{t.title ?? t.name ?? t.key ?? `#${t.id}`}</Typography>
              </Box>
            ))
          )}
        </Box>
      )}
    </Container>
  );
}

export default QuestionsPanel;
