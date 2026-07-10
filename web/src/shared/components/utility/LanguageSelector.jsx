import React, { useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { MdLanguage } from "react-icons/md";
import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";

export default function LanguageSelector() {
  const { languages, loadingLngs } = useLanguage();
  const { lng, changeLanguage } = useLanguageSwitcherContext();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleSelectLanguage = (langCode) => {
    changeLanguage(langCode);
    handleCloseMenu();
  };

  const getLanguageFlag = (code) => {
    const flags = {
      en: "🇺🇸",
      ar: "🇸🇦",
      fr: "🇫🇷",
      es: "🇪🇸",
      de: "🇩🇪",
      it: "🇮🇹",
      pt: "🇵🇹",
      ru: "🇷🇺",
      ja: "🇯🇵",
      ko: "🇰🇷",
      zh: "🇨🇳",
    };
    return flags[code] || "🌐";
  };

  if (loadingLngs) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const currentLang = languages?.find((l) => l.code === lng);

  return (
    <>
      <Chip
        icon={<MdLanguage />}
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span>{getLanguageFlag(lng)}</span>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {currentLang?.name || lng?.toUpperCase()}
            </Typography>
          </Box>
        }
        onClick={handleOpenMenu}
        sx={{
          bgcolor: "#f0f0f0",
          cursor: "pointer",
          "&:hover": {
            bgcolor: "#e0e0e0",
          },
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleSelectLanguage(language.code)}
            selected={lng === language.code}
          >
            {getLanguageFlag(language.code)} {language.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
