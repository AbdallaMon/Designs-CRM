import { Box, Chip, Typography } from "@mui/material";

export default function RenderTitle({ titles }) {
  return (
    <>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Titles ({titles.length} languages)
      </Typography>
      {titles.map((title) => (
        <Box mb={1} key={title.id}>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={title.language.code.toUpperCase()}
              size="small"
              variant="outlined"
            />
            <Typography variant="body2">{title.text}</Typography>
          </Box>
        </Box>
      ))}
    </>
  );
}
