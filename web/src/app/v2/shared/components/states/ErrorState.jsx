"use client";

// <ErrorState /> — plain-Arabic cause + a retry button (UX plan §2). Driven off a useRequest
// `error` (a CODE or raw message) resolved through the shared message resolver (optionally a
// feature-specific resolver map). Never shows a raw ALL_CAPS code to the user. The retry calls
// back into the caller's `refetch`. Single-language Arabic / RTL; alert role for AT (4.1.3).
//
// Props:
//   error     string|object — the useRequest error (string code/message, or { message }).
//   onRetry   () => void?    — retry handler (usually the hook's refetch).
//   resolver  Record<string,string>? — feature CODE→Arabic map checked before the shared map.
//   title     string?        — headline (default "تعذّر تحميل البيانات").

import { Stack, Typography, Button, Box } from "@mui/material";
import { MdErrorOutline, MdRefresh } from "react-icons/md";
import { resolveSharedMessage } from "../../config/sharedMessages";
import { useT } from "@/app/v2/lib/i18n/I18nProvider";

export function ErrorState({ error, onRetry, resolver, title }) {
  const { t, lang } = useT();
  const code = typeof error === "string" ? error : error?.message;
  const detail = resolveSharedMessage(code, { resolver, lang });
  const resolvedTitle = title ?? t("state.error.title", "تعذّر تحميل البيانات");

  return (
    <Stack
      role="alert"
      alignItems="center"
      justifyContent="center"
      spacing={1.5}
      sx={{ textAlign: "center", py: 8, px: 3 }}
    >
      <Box sx={{ fontSize: 56, color: "error.main", lineHeight: 1, display: "flex" }}>
        <MdErrorOutline />
      </Box>
      <Typography variant="h6" component="p">
        {resolvedTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
        {detail}
      </Typography>
      {onRetry && (
        <Button
          variant="outlined"
          color="primary"
          onClick={onRetry}
          startIcon={<MdRefresh />}
          sx={{ mt: 1 }}
        >
          {t("common.retry", "إعادة المحاولة")}
        </Button>
      )}
    </Stack>
  );
}

export default ErrorState;
