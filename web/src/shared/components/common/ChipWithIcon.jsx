import { Chip, lighten, useTheme } from "@mui/material";

export default function ChipWithIcon({ conf }) {
  const theme = useTheme();
  if (!conf) return null;
  const Icon = conf.icon || null;

  // conf.pallete/shade come from constant maps keyed by free-text values (e.g. stage titles),
  // so guard the palette lookup instead of throwing on an unknown/misconfigured key.
  const bgColor =
    theme.palette[conf.pallete]?.[conf.shade] || theme.palette.grey[300];
  return (
    <Chip
      icon={Icon ? <Icon /> : undefined}
      label={conf.name}
      sx={{
        backgroundColor: lighten(bgColor, 0.7),
      }}
    />
  );
}
