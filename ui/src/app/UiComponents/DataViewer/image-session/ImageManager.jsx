import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid2 as Grid,
  Chip,
  IconButton,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from "@mui/material";

import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import DeleteModal from "../../models/DeleteModal";
import SimpleFileInput from "../../formComponents/SimpleFileInput";
import { MdAdd, MdClear, MdEdit, MdImage } from "react-icons/md";
import FullScreenLoader from "../../feedback/loaders/FullscreenLoader";

const ImageManager = () => {
  const [images, setImages] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatterns, setSelectedPatterns] = useState([]);
  const [selectedSpaces, setSelectedSpaces] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [formData, setFormData] = useState({
    file: null,
    patterns: [],
    spaces: [],
  });

  const { setAlertError } = useAlertContext();
  const { setLoading: setSubmitLoading } = useToastContext();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [imagesData, patternsData, spacesData] = await Promise.all([
      getData({ url: "shared/image-session/images?", setLoading }),
      getData({ url: "shared/image-session?model=colorPattern&", setLoading }),
      getData({ url: "shared/image-session?model=space&", setLoading }),
    ]);

    if (
      imagesData.status === 200 &&
      patternsData.status === 200 &&
      spacesData.status === 200
    ) {
      setImages(imagesData.data || []);
      setPatterns(patternsData.data || []);
      setSpaces(spacesData.data || []);
    }
  };

  const handleOpenDialog = (image = null) => {
    setEditingImage(image);
    setFormData({
      file: null, // Always null since we don't edit the image file itself
      patterns: image?.patterns?.map((p) => p.id) || [],
      spaces: image?.spaces?.map((s) => s.id) || [],
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingImage(null);
    setFormData({ file: null, patterns: [], spaces: [] });
  };

  const handleSubmit = async () => {
    // For new images, file upload is required
    if (!editingImage && !formData.file) {
      setAlertError("You must upload file");
      return;
    }

    if (formData.patterns.length === 0) {
      setAlertError("At least one color pattern must be selected");
      return;
    }

    if (formData.spaces.length === 0) {
      setAlertError("At least one space must be selected");
      return;
    }

    let imageUrl = editingImage?.url; // Use existing URL for edits

    // Upload file only for new images
    if (!editingImage && formData.file) {
      const uploadFormData = new FormData();
      uploadFormData.append("file", formData.file);
      const uploadResponse = await handleRequestSubmit(
        uploadFormData,
        setSubmitLoading,
        "utility/upload",
        true,
        "Uploading file"
      );

      if (uploadResponse.status !== 200) {
        setAlertError("Error uploading file");
        return;
      }
      imageUrl = uploadResponse.fileUrls.file[0];
    }

    // Prepare data for backend
    const submitData = {
      url: imageUrl,
      patterns: formData.patterns,
      spaces: formData.spaces,
    };
    const url = editingImage
      ? `admin/images/${editingImage.id}`
      : "admin/images";

    const method = editingImage ? "PUT" : "POST";

    const request = await handleRequestSubmit(
      submitData,
      setSubmitLoading,
      url,
      false,
      "Submitting",
      false,
      method
    );
    if (request.status === 200) {
      await fetchData();
      handleCloseDialog();
    }
  };

  const handleDelete = async (imageId) => {
    await fetchData();
  };

  const clearFilters = () => {
    setSelectedPatterns([]);
    setSelectedSpaces([]);
  };

  const filteredImages = images.filter((image) => {
    // Filter by archived status
    if (image.isArchived) return false;

    // Filter by patterns
    if (selectedPatterns.length > 0) {
      const hasSelectedPattern = image.patterns?.some((pattern) =>
        selectedPatterns.includes(pattern.id)
      );
      if (!hasSelectedPattern) return false;
    }

    // Filter by spaces
    if (selectedSpaces.length > 0) {
      const hasSelectedSpace = image.spaces?.some((space) =>
        selectedSpaces.includes(space.id)
      );
      if (!hasSelectedSpace) return false;
    }

    return true;
  });

  return (
    <Box sx={{ p: 3, position: "relative" }}>
      {loading && <FullScreenLoader />}
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <MdImage sx={{ mr: 2, fontSize: 32, color: "primary.main" }} />
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Image Gallery
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Filter by Patterns</InputLabel>
              <Select
                multiple
                value={selectedPatterns}
                onChange={(e) => setSelectedPatterns(e.target.value)}
                input={<OutlinedInput label="Filter by Patterns" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => {
                      const pattern = patterns.find((p) => p.id === value);
                      return (
                        <Chip key={value} label={pattern?.name} size="small" />
                      );
                    })}
                  </Box>
                )}
              >
                {patterns.map((pattern) => (
                  <MenuItem key={pattern.id} value={pattern.id}>
                    <Checkbox
                      checked={selectedPatterns.indexOf(pattern.id) > -1}
                    />
                    <ListItemText primary={pattern.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Filter by Spaces</InputLabel>
              <Select
                multiple
                value={selectedSpaces}
                onChange={(e) => setSelectedSpaces(e.target.value)}
                input={<OutlinedInput label="Filter by Spaces" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => {
                      const space = spaces.find((s) => s.id === value);
                      return (
                        <Chip key={value} label={space?.name} size="small" />
                      );
                    })}
                  </Box>
                )}
              >
                {spaces.map((space) => (
                  <MenuItem key={space.id} value={space.id}>
                    <Checkbox checked={selectedSpaces.indexOf(space.id) > -1} />
                    <ListItemText primary={space.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ sm: 4 }}>
            <Button
              startIcon={<MdClear />}
              onClick={clearFilters}
              disabled={
                selectedPatterns.length === 0 && selectedSpaces.length === 0
              }
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Images Grid */}
      <Grid container spacing={3}>
        {filteredImages.map((image) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={image.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
                opacity: image.isArchived ? 0.7 : 1,
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={image.url}
                alt="Image"
                sx={{ objectFit: "cover" }}
                onError={(e) => {
                  e.target.src = "/placeholder-image.png";
                }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Patterns */}
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Patterns:
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.5,
                      mt: 0.5,
                    }}
                  >
                    {image.patterns?.map((pattern) => (
                      <Chip
                        key={pattern.id}
                        label={pattern.name}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                {/* Spaces */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Spaces:
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.5,
                      mt: 0.5,
                    }}
                  >
                    {image.spaces?.map((space) => (
                      <Chip
                        key={space.id}
                        label={space.name}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <IconButton
                      onClick={() => {
                        handleOpenDialog(image);
                      }}
                    >
                      <MdEdit />
                    </IconButton>
                  </Box>
                  <Box>
                    <DeleteModal
                      item={image}
                      handleClose={handleDelete}
                      href="admin/images"
                      buttonType="ICON"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {filteredImages.length === 0 && !loading && (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            color: "text.secondary",
          }}
        >
          <MdImage sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom>
            {selectedPatterns.length > 0 || selectedSpaces.length > 0
              ? "No images found"
              : "No images yet"}
          </Typography>
          <Typography variant="body2">
            {selectedPatterns.length > 0 || selectedSpaces.length > 0
              ? "Try adjusting your filters"
              : "Add your first image to get started"}
          </Typography>
        </Box>
      )}

      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: 24, right: 24 }}
        onClick={() => handleOpenDialog()}
      >
        <MdAdd />
      </Fab>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingImage ? "Edit Image" : "Add New Image"}
        </DialogTitle>
        <DialogContent>
          {!editingImage && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Upload Image *
              </Typography>
              <SimpleFileInput
                label="Image"
                id="file"
                variant="outlined"
                setData={setFormData}
              />{" "}
            </Box>
          )}

          {editingImage && (
            <Box sx={{ mb: 2, textAlign: "center" }}>
              <Typography variant="subtitle2" gutterBottom>
                Current Image
              </Typography>
              <img
                src={editingImage.url}
                alt="Current"
                style={{
                  maxWidth: "100%",
                  maxHeight: "200px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                }}
              />
              <Typography
                variant="caption"
                display="block"
                sx={{ mt: 1, color: "text.secondary" }}
              >
                Note: You can only edit the patterns and spaces, not the image
                itself
              </Typography>
            </Box>
          )}

          {/* Image Preview for new uploads */}
          {!editingImage && formData.file && (
            <Box sx={{ mb: 2, textAlign: "center" }}>
              <Typography variant="subtitle2" gutterBottom>
                Preview
              </Typography>
              <img
                src={URL.createObjectURL(formData.file)}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "200px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                }}
              />
            </Box>
          )}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Color Patterns *</InputLabel>
            <Select
              multiple
              value={formData.patterns}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, patterns: e.target.value }))
              }
              input={<OutlinedInput label="Color Patterns *" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => {
                    const pattern = patterns.find((p) => p.id === value);
                    return (
                      <Chip
                        key={value}
                        label={pattern?.name}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {patterns.map((pattern) => (
                <MenuItem key={pattern.id} value={pattern.id}>
                  <Checkbox
                    checked={formData.patterns.indexOf(pattern.id) > -1}
                  />
                  <ListItemText primary={pattern.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Spaces *</InputLabel>
            <Select
              multiple
              value={formData.spaces}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, spaces: e.target.value }))
              }
              input={<OutlinedInput label="Spaces *" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => {
                    const space = spaces.find((s) => s.id === value);
                    return (
                      <Chip
                        key={value}
                        label={space?.name}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {spaces.map((space) => (
                <MenuItem key={space.id} value={space.id}>
                  <Checkbox checked={formData.spaces.indexOf(space.id) > -1} />
                  <ListItemText primary={space.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              (!editingImage && !formData.file) ||
              formData.patterns.length === 0 ||
              formData.spaces.length === 0
            }
          >
            {editingImage ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageManager;
