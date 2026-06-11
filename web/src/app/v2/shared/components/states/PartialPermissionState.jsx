"use client";

// <PartialPermissionState /> — for screens where the role can see SOME but not all of a
// surface (UX plan §2). Shows what's allowed and explains what's blocked — never a bare 403.
// Two uses:
//   1) As a wrapper banner above partially-visible content (`children`): a soft notice that
//      some sections are hidden for this role.
//   2) As a full-screen notice when the user has NO access at all (pass `denied`): a calm
//      explanation instead of a crash/redirect.
// Blocked actions elsewhere should be HIDDEN or disabled-with-reason (see <PageHeader>
// primaryAction.reason), not rendered as a clickable 403. Single-language Arabic / RTL.
//
// Props:
//   denied      bool      — render the full "no access" notice (default false → banner mode).
//   title       string?   — headline.
//   message     string?   — plain-Arabic explanation of what is/ isn't available.
//   allowed     string[]? — short labels of what the user CAN see (rendered as a hint list).
//   children    node?     — the partially-visible content (banner mode).

import { Box, Stack, Typography, Alert, AlertTitle, Chip } from "@mui/material";
import { MdLockOutline } from "react-icons/md";
import { useT } from "@/app/v2/lib/i18n/I18nProvider";

export function PartialPermissionState({
  denied = false,
  title,
  message,
  allowed,
  children,
}) {
  const { t } = useT();
  if (denied) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={1.5}
        sx={{ textAlign: "center", py: 8, px: 3 }}
      >
        <Box sx={{ fontSize: 56, color: "text.disabled", lineHeight: 1, display: "flex" }}>
          <MdLockOutline />
        </Box>
        <Typography variant="h6" component="p">
          {title ?? t("state.partial.deniedTitle", "هذا القسم غير متاح لصلاحياتك")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440 }}>
          {message ??
            t(
              "state.partial.deniedMessage",
              "لا تملك صلاحية الوصول إلى هذا القسم. إن كنت تظن أنه ينبغي أن تصل إليه، تواصل مع المسؤول.",
            )}
        </Typography>
        {Array.isArray(allowed) && allowed.length > 0 && (
          <AllowedHints allowed={allowed} />
        )}
      </Stack>
    );
  }

  // Banner mode: a notice + the partial content beneath it.
  return (
    <Box>
      <Alert severity="info" icon={<MdLockOutline />} sx={{ mb: 2 }}>
        <AlertTitle>{title ?? t("state.partial.bannerTitle", "عرض محدود حسب صلاحياتك")}</AlertTitle>
        {message ?? t("state.partial.bannerMessage", "بعض الأقسام مخفية لأنها خارج نطاق صلاحياتك.")}
        {Array.isArray(allowed) && allowed.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <AllowedHints allowed={allowed} />
          </Box>
        )}
      </Alert>
      {children}
    </Box>
  );
}

function AllowedHints({ allowed }) {
  return (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" justifyContent="center">
      {allowed.map((label, i) => (
        <Chip key={i} size="small" label={label} variant="outlined" />
      ))}
    </Stack>
  );
}

export default PartialPermissionState;
