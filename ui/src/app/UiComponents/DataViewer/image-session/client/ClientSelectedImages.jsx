import { Box, Paper, Typography, Grid2 as Grid } from "@mui/material";
import { SelectedPatterns } from "./Utility";
import { NotesComponent } from "../../utility/Notes";
import { ImageComponent } from "./ImageComponent";
import { ImagePreviewDialog } from "./ImagePreviewDialog";
import { useState } from "react";

export function ClientSelectedImages({
  availablePatterns,
  selectedPattern,
  session,
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const handlePreviewOpen = (startIndex) => {
    setCurrentPreviewIndex(startIndex);
    setPreviewOpen(true);
  };

  const handleImageClick = (image) => {
    const imageIndex = session.selectedImages.findIndex(
      (img) => img.id === image.id
    );
    handlePreviewOpen(imageIndex);
  };

  return (
    <Box sx={{ p: 0 }}>
      <Typography variant="h5" gutterBottom>
        Review Your Selections
      </Typography>

      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <SelectedPatterns
            availablePatterns={availablePatterns}
            selectedPattern={selectedPattern}
          />
          <NotesComponent
            id={session?.id}
            idKey="imageSessionId"
            slug="client"
            text="Add general note"
          />
        </Box>
      </Paper>

      {/* Images Review by Space */}
      <Typography variant="h6" gutterBottom>
        Selected Images ({session?.selectedImages?.length || 0} total)
      </Typography>

      <Grid container spacing={2}>
        {session?.selectedImages.map((selectedImage) => (
          <Grid size={{ xs: 6, sm: 4 }} key={selectedImage.id}>
            <ImageComponent
              handleImageClick={handleImageClick}
              image={selectedImage}
            />
          </Grid>
        ))}
      </Grid>

      <ImagePreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        images={session.selectedImages}
        currentIndex={currentPreviewIndex}
        onIndexChange={setCurrentPreviewIndex}
        selectedImages={session.selectedImages}
        type="not-select"
      />
    </Box>
  );
}
