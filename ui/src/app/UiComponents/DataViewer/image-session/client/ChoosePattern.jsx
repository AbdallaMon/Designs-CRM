import colors from "@/app/helpers/colors";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid2 as Grid,
  useMediaQuery,
  useTheme,
} from "@mui/material";

export function ChoosePattern({
  selectedPattern,
  availablePatterns,
  handlePatternSelect,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Function to render the color chain based on pattern.colors

  return (
    <Box sx={{ pb: 2 }}>
      {" "}
      {/* Added padding bottom for better mobile spacing */}
      <Typography
        variant={isMobile ? "h6" : "h5"} // Smaller heading on mobile
        gutterBottom
        sx={{
          px: isMobile ? 2 : 3,
          pt: isMobile ? 2 : 0,
          textAlign: isMobile ? "center" : "left",
        }} // Centered and padded on mobile
      >
        Choose Your Color Pattern
      </Typography>
      <Grid
        container
        spacing={isMobile ? 2 : 2}
        sx={{ p: 0, justifyContent: "center" }}
      >
        {availablePatterns.map((pattern) => (
          <Grid size={{ md: 6 }} key={pattern.id}>
            <Card
              sx={{
                cursor: "pointer",
                transition: "transform 0.2s, border-color 0.2s",
                border: selectedPattern.includes(pattern.id)
                  ? `2px solid ${colors.primary}`
                  : `1px solid ${theme.palette.divider}`, // Softer default border
                transform: selectedPattern.includes(pattern.id)
                  ? "scale(1.03)" // Slightly more pronounced scale on selection
                  : "scale(1)",
                boxShadow: selectedPattern.includes(pattern.id)
                  ? `0px 4px 10px rgba(0, 0, 0, 0.15)` // Add a subtle shadow on selection
                  : `0px 2px 5px rgba(0, 0, 0, 0.05)`, // Lighter shadow normally
                display: "flex",
                flexDirection: "column",
                height: "100%", // Ensure cards in a row have same height
                borderRadius: theme.shape.borderRadius, // Apply theme border radius
              }}
              onClick={() => handlePatternSelect(pattern)}
            >
              <CardMedia
                component="img"
                height={isMobile ? "120" : "150"} // Smaller image height on mobile
                image={pattern.avatarUrl}
                alt={pattern.name}
                sx={{
                  objectFit: "cover",
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              />
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
