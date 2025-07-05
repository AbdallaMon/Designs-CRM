import { AppBar, Avatar, Box, Toolbar, Typography } from "@mui/material";
import { MdPalette } from "react-icons/md";

export function SelectedPatterns({ availablePatterns, selectedPattern }) {
  return (
    <Box display="flex" alignItems="center" flexWrap="wrap" gap={2}>
      {availablePatterns && selectedPattern?.length > 0 ? (
        selectedPattern.map((pattern) => {
          const currentPattern = availablePatterns.find(
            (p) => p.id === pattern
          );
          return (
            <Box key={pattern} display="flex" alignItems="center">
              <Avatar sx={{ mr: 1 }}>
                <MdPalette />
              </Avatar>
              <Box>
                <Typography variant="subtitle1">
                  {currentPattern.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Selected Pattern
                </Typography>
              </Box>
            </Box>
          );
        })
      ) : (
        <Typography>No patterns selected</Typography>
      )}
    </Box>
  );
}

export function ClientImageAppBar() {
  return (
    <AppBar position="sticky" elevation={1} sx={{ my: 2 }}>
      <Toolbar>
        <img
          src="https://dreamstudiio.com/dream-logo.jpg"
          style={{
            width: "40px",
            height: "40px",
          }}
        />
      </Toolbar>
    </AppBar>
  );
}
