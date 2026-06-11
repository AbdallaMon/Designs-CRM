import { Box, Chip, Typography } from "@mui/material";

export default function RenderTitle({ titles, type = "TITLE" }) {
  const label = type === "TITLE" ? "Titles" : "Descriptions";
  const key = type === "TITLE" ? "text" : "content";
  return (
    <>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {label} ({titles.length} languages)
      </Typography>
      {titles.map((title) => (
        <Box mb={1} key={title.id}>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={title.language.code.toUpperCase()}
              size="small"
              variant="outlined"
            />
            <Typography
              sx={{
                wordWrap: "break-word",
                overflowWrap: "break-word",
                wordBreak: "break-all",
              }}
              variant="body2"
            >
              {title[key]}
            </Typography>
          </Box>
        </Box>
      ))}
    </>
  );
}
