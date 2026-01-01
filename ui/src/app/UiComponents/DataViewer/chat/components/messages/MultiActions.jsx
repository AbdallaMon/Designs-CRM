import { Grid, IconButton, Paper, Typography } from "@mui/material";
import { FaShare, FaTrash } from "react-icons/fa";
import { MdClose } from "react-icons/md";

export function MultiActions({
  selectedMessages,
  setSelectedMessages,
  onDelete,
  openForwardDialog,
  setOpenForwardDialog,
}) {
  if (selectedMessages.length === 0) {
    return null;
  }
  return (
    <Paper
      elevation={3}
      sx={{
        position: "absolute",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1304,
        display: "flex",
        gap: 2,
        padding: 1,
        bgcolor: "background.default",
      }}
    >
      <Grid
        container
        alignItems="center"
        spacing={1}
        sx={{
          width: { xs: "90%", sm: "400px" },
        }}
      >
        <Grid
          size={6}
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
          }}
        >
          <IconButton
            size="medium"
            color="primary"
            onClick={() => {
              setSelectedMessages([]);
              setOpenForwardDialog(false);
            }}
          >
            <MdClose size={16} />
          </IconButton>
          <Typography variant="body1">
            {selectedMessages.length} selected
          </Typography>
        </Grid>
        <Grid
          size={6}
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <IconButton
            size="medium"
            color="primary"
            onClick={() => {
              if (openForwardDialog) return;
              setOpenForwardDialog(true);
            }}
          >
            <FaShare size={16} />
          </IconButton>
          <IconButton
            size="medium"
            color="error"
            onClick={() => {
              onDelete();
            }}
          >
            <FaTrash size={16} />
          </IconButton>
        </Grid>
      </Grid>
    </Paper>
  );
}
