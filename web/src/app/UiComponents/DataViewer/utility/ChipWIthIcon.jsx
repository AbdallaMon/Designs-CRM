import { Chip, lighten, useTheme } from "@mui/material";

export default function ChipWithIcon({ conf }) {
  const Icon = conf.icon || null;
  const theme = useTheme();

  const bgColor = theme.palette[conf.pallete][conf.shade];
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
