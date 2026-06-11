"use client";

// <LanguageSwitcher /> — a small ع / EN toggle for the AUTHED shell header (Phase 1).
//
// Shows the label of the OTHER language (the one a click switches TO): in Arabic it reads "EN"
// (switch to English), in English it reads "ع" (switch to Arabic). Clicking calls the I18n
// context's toggleLanguage(), which writes the `lang` cookie, updates the URL `?lang`, flips
// <html lang dir>, and router.refresh()es so the server rebuilds the emotion cache (muirtl ↔ mui)
// and re-renders in the new language. Arabic remains the default; this only flips on user intent.

import { Button, Tooltip } from "@mui/material";
import { MdTranslate } from "react-icons/md";
import { useT } from "@/app/v2/lib/i18n/I18nProvider";

export function LanguageSwitcher() {
  const { lang, toggleLanguage, t } = useT();

  // Label = the language we'd switch TO.
  const nextLabel = lang === "ar" ? "EN" : "ع";

  return (
    <Tooltip title={t("shell.lang.toggle", "تغيير اللغة")} arrow>
      <Button
        onClick={toggleLanguage}
        size="small"
        color="inherit"
        startIcon={<MdTranslate size={18} />}
        aria-label={t("shell.lang.toggle", "تغيير اللغة")}
        sx={(theme) => ({
          minWidth: 0,
          px: 1.25,
          height: 36,
          borderRadius: 2,
          fontWeight: 700,
          color: "text.secondary",
          border: `1px solid ${theme.palette.divider}`,
          "& .MuiButton-startIcon": { mr: 0.5, ml: 0 },
        })}
      >
        {nextLabel}
      </Button>
    </Tooltip>
  );
}

export default LanguageSwitcher;
