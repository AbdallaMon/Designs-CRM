import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Chip,
  Paper,
  Typography,
  Grid2 as Grid,
  Card,
  CardMedia,
  CardContent,
} from "@mui/material";
import { SelectedPatterns } from "./Utility";
import { NotesComponent } from "../../utility/Notes";
import { MdExpandMore, MdRoom } from "react-icons/md";

export function ClientSelectedImages({
  availablePatterns,
  selectedPattern,
  session,
}) {
  const groupSelectedImagesBySpace = () => {
    if (!session?.selectedImages || !session?.selectedSpaces) return [];

    const spaceGroups = {};

    session.selectedSpaces.forEach(({ space }) => {
      spaceGroups[space.id] = {
        space: space,
        images: [],
      };
    });

    // Group selected images by their spaces
    session.selectedImages.forEach((selectedImage) => {
      const image = selectedImage.image;
      if (image.spaces && image.spaces.length > 0) {
        image.spaces.forEach((space) => {
          if (spaceGroups[space.id]) {
            spaceGroups[space.id].images.push(selectedImage);
          }
        });
      }
    });
    return Object.values(spaceGroups);
  };
  const selectedImagesBySpaceForReview = groupSelectedImagesBySpace();
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

      {selectedImagesBySpaceForReview.map((spaceGroup) => (
        <Accordion key={spaceGroup.space.id} defaultExpanded>
          <AccordionSummary expandIcon={<MdExpandMore />}>
            <Box display="flex" alignItems="center" gap={1}>
              {/* Space Avatar */}
              {spaceGroup.space.avatarUrl ? (
                <Avatar
                  src={spaceGroup.space.avatarUrl}
                  alt={spaceGroup.space.name}
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                  <MdRoom />
                </Avatar>
              )}

              <Typography variant="h6">{spaceGroup.space.name}</Typography>
              <Chip
                label={`${spaceGroup.images.length} images`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {spaceGroup.images.map((selectedImage) => (
                <Grid size={{ xs: 6, sm: 4 }} key={selectedImage.id}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="120"
                      image={selectedImage.image.url}
                      alt={`Selected Image ${selectedImage.id}`}
                    />
                    <CardContent sx={{ p: 1 }}>
                      <NotesComponent
                        id={selectedImage.id}
                        idKey="selectedImageId"
                        slug="client"
                        text="Add note"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
