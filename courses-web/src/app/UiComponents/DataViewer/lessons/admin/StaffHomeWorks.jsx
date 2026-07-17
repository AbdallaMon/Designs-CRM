"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Container,
} from "@mui/material";
import {
  MdVisibility as VisibilityIcon,
  MdVideoFile as VideoIcon,
  MdSummarize as SummaryIcon,
  MdClose as CloseIcon,
  MdOpenInNew as OpenInNewIcon,
} from "react-icons/md";

import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";

const HomeworkTable = ({ courseId, lessonId }) => {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fetchHomeworks = async () => {
    await getDataAndSet({
      url: `admin/courses/${courseId}/lessons/${lessonId}/home-works`,
      setLoading,
      setData: setHomeworks,
    });
  };

  useEffect(() => {
    if (lessonId) {
      fetchHomeworks();
    }
  }, [lessonId]);

  // Get icon based on homework type
  const getTypeIcon = (type) => {
    switch (type) {
      case "VIDEO":
        return <VideoIcon color="error" />;
      case "SUMMARY":
        return <SummaryIcon color="primary" />;
      default:
        return <SummaryIcon color="action" />;
    }
  };

  // Get color for homework type chip
  const getTypeColor = (type) => {
    switch (type) {
      case "VIDEO":
        return "error";
      case "SUMMARY":
        return "primary";
      default:
        return "default";
    }
  };

  // Handle preview dialog for all student homeworks
  const handlePreviewAll = (student) => {
    setSelectedStudent(student);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setSelectedStudent(null);
  };

  // Open homework URL in new tab
  const openHomework = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (homeworks?.length === 0) {
    return (
      <Alert severity="info">No homeworks submitted for this lesson yet.</Alert>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Lesson Homeworks
      </Typography>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "grey.50" }}>
              <TableCell sx={{ fontWeight: "bold" }}>Staff Name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>
                Homeworks
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {homeworks.map((student, index) => (
              <TableRow key={`${student.email}-${index}`} hover>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {student.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {student.email}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    gap={1}
                  >
                    <Chip
                      label={student.listOfHomeworks.length}
                      color="primary"
                      size="small"
                    />
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Preview all homeworks">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handlePreviewAll(student)}
                      disabled={student.listOfHomeworks.length === 0}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Preview Dialog for All Homeworks */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: "60vh" },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h6" component="div">
              {selectedStudent?.name}'s Homeworks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedStudent?.email} •{" "}
              {selectedStudent?.listOfHomeworks.length} homework
              {selectedStudent?.listOfHomeworks.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
          <IconButton onClick={handleClosePreview}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {selectedStudent?.listOfHomeworks.length > 0 ? (
            <List>
              {selectedStudent.listOfHomeworks.map((homework, index) => (
                <React.Fragment key={homework.id}>
                  <ListItem
                    sx={{
                      border: 1,
                      borderColor: "grey.200",
                      borderRadius: 1,
                      mb: 1,
                      "&:hover": {
                        backgroundColor: "grey.50",
                      },
                    }}
                  >
                    <ListItemIcon>{getTypeIcon(homework.type)}</ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1" fontWeight="medium">
                            {homework.title}
                          </Typography>
                          <Chip
                            label={homework.type}
                            color={getTypeColor(homework.type)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          Click to open homework
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Open homework">
                        <IconButton
                          edge="end"
                          color="primary"
                          onClick={() => openHomework(homework.url)}
                        >
                          <OpenInNewIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < selectedStudent.listOfHomeworks.length - 1 && (
                    <Divider sx={{ my: 1 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No homeworks found
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClosePreview} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HomeworkTable;
