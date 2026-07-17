"use client";

import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Grid,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  TextField,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  MdQuiz,
  MdEdit,
  MdPreview,
  MdAccessTime,
  MdVisibility,
  MdVisibilityOff,
  MdAdd,
  MdPerson,
  MdRefresh,
} from "react-icons/md";
import Link from "next/link";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import DeleteModal from "@/app/models/DeleteModal";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { FaClipboardList, FaQuestion, FaTypo3 } from "react-icons/fa";

export function Tests({ type, id }) {
  const [data, setData] = useState({ title: "", tests: [] });
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [defaultAttempts, setDefaultAttempts] = useState(2);
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState(60);
  const [publish, setPublish] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTest, setEditTest] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTimeLimit, setEditTimeLimit] = useState(60);
  const [editAttempts, setEditAttempts] = useState(2);
  const [editPublish, setEditPublish] = useState(false);
  const { toastLoading: createLoading, setToastLoading: setCreateLoading } =
    useToastContext();

  useEffect(() => {
    if (id && type) {
      getTests();
    }
  }, [id, type]);

  async function getTests() {
    const key = type === "COURSE" ? "courseId" : "lessonId";
    const endpoint = `admin/courses/tests?key=${key}&id=${id}&`;

    await getDataAndSet({
      url: endpoint,
      setData,
      setLoading,
    });
  }

  async function handleCreateTest() {
    const key = type === "COURSE" ? "courseId" : "lessonId";
    const req = await handleRequestSubmit(
      {
        attemptLimit: defaultAttempts,
        testType: type === "COURSE" ? "FINAL" : "LESSON",
        title,
        timeLimit,
        published: publish,
      },
      setCreateLoading,
      `admin/courses/tests?key=${key}&id=${id}&`,
      false,
      "Creating",
      false
    );
    if (req.status === 200) {
      setCreateDialogOpen(false);
      setDefaultAttempts(2); // Reset to default
      setTimeLimit(60);
      setTitle("");
      setPublish(false);
      window.location.href = `/dashboard/tests/${req.data.id}`;
    }
  }
  async function handleEditTest() {
    if (!editTest) return;
    const req = await handleRequestSubmit(
      {
        title: editTitle,
        timeLimit: editTimeLimit,
        attemptLimit: editAttempts,
        published: editPublish,
      },
      setCreateLoading,
      `admin/courses/tests/${editTest.id}`,
      false,
      "Updating",
      false,
      "PUT"
    );

    if (req.status === 200) {
      setEditDialogOpen(false);
      setEditTest(null);
      await getTests();
    }
  }

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setDefaultAttempts(2);
    setTimeLimit(60);
    setTitle("");
    setPublish(false);
  };

  const formatDuration = (duration) => {
    if (!duration) return "No duration set";
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getTypeTitle = () => {
    return type === "COURSE" ? "Course" : "Lesson";
  };

  return (
    <Box>
      <AppBar position="static" elevation={1}>
        {loading && <FullScreenLoader />}
        <Container maxWidth="lg">
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h5" component="h2" sx={{ flexGrow: 1 }}>
              Tests for {getTypeTitle().toLowerCase()} {data.title}
            </Typography>
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create New Test
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {data?.tests?.length === 0 && !loading && (
            <Alert severity="info">
              No tests found for this {getTypeTitle().toLowerCase()}. Create
              your first test to get started.
            </Alert>
          )}
          {data?.tests?.map((test) => (
            <Grid size={{ sm: 6, md: 4 }}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Typography variant="h6" component="h3" gutterBottom>
                      {test.title || `Test #${test.id}`}
                    </Typography>
                    
                    <DeleteModal
                      buttonType="ICON"
                      item={test}
                      href={`admin/courses/tests`}
                      handleClose={getTests}
                    />
                  </Box>

                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <MdAccessTime size={16} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDuration(test.timeLimit)}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={0.5}>
                      <MdRefresh size={16} />
                      <Typography variant="body2" color="text.secondary">
                        Attatmpts limit {test.attemptLimit}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" gap={1} flexWrap="wrap">
                         <Chip
                      icon={<FaTypo3 />}
                      label={`Type: ${test.type}`}
                      size="small"
                      variant="outlined"
                    />

                    <Chip
                      icon={<FaQuestion />}
                      label={`${test._count?.questions || 0} question${
                        (test._count?.questions || 0) !== 1 ? "s" : ""
                      }`}
                      size="small"
                      variant="outlined"
                    />

                    <Chip
                      icon={<MdPerson />}
                      label={`${test._count?.attempts || 0} submission${
                        (test._count?.attempts || 0) !== 1 ? "s" : ""
                      }`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>

                <CardActions
                  sx={{ justifyContent: "space-between", px: 2, pb: 2 }}
                >
                  <Button
                    startIcon={<FaQuestion />}
                    variant="contained"
                    size="small"
                    component={Link}
                    href={`/dashboard/tests/${test.id}`}
                  >
                    Add question
                  </Button>
                      <Button
                    startIcon={<FaClipboardList  />}
                    variant="contained"
                    size="small"
                    component={Link}
                    href={`/dashboard/tests/${test.id}/attempts`}
                  >
                    Preview users attempts
                  </Button>
                  <Button
                    startIcon={<MdEdit />}
                    variant="contained"
                    size="small"
                    onClick={() => {
                      setEditTest(test);
                      setEditDialogOpen(true);
                      setEditTitle(test.title || "");
                      setEditTimeLimit(test.timeLimit || 0);
                      setEditAttempts(test.attemptLimit || 2);
                      setEditPublish(test.published);
                    }}
                  >
                    Edit
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Create Test Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Test</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Test Title"
              fullWidth
              variant="outlined"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              helperText="Optional test title"
            />

            <TextField
              label="Time Limit (minutes)"
              type="number"
              fullWidth
              variant="outlined"
              value={editTimeLimit}
              onChange={(e) => setEditTimeLimit(Number(e.target.value))}
              inputProps={{ min: 0 }}
              helperText="Leave blank or 0 for no time limit"
            />

            <TextField
              label="Default Attempts"
              type="number"
              fullWidth
              variant="outlined"
              value={editAttempts}
              onChange={(e) => setEditAttempts(Number(e.target.value))}
              inputProps={{ min: 1, max: 10 }}
              helperText="Number of attempts users get by default (1-10)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editPublish}
                  onChange={(e) => setEditPublish(e.target.checked)}
                />
              }
              label="Published"
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setEditDialogOpen(false)}
            disabled={createLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditTest}
            variant="contained"
            disabled={createLoading}
            startIcon={
              createLoading ? <CircularProgress size={16} /> : <MdEdit />
            }
          >
            {createLoading ? "Updating..." : "Update Test"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Test</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Test Title"
              fullWidth
              variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              helperText="Optional test title"
            />

            <TextField
              label="Time Limit (minutes)"
              type="number"
              fullWidth
              variant="outlined"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              inputProps={{ min: 0 }}
              helperText="Leave blank or 0 for no time limit"
            />

            <TextField
              label="Default Attempts"
              type="number"
              fullWidth
              variant="outlined"
              value={defaultAttempts}
              onChange={(e) => setDefaultAttempts(Number(e.target.value))}
              inputProps={{ min: 1, max: 10 }}
              helperText="Number of attempts users get by default (1-10)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={publish}
                  onChange={(e) => setPublish(e.target.checked)}
                />
              }
              label="Published"
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseCreateDialog} disabled={createLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTest}
            variant="contained"
            disabled={createLoading}
            startIcon={
              createLoading ? <CircularProgress size={16} /> : <MdAdd />
            }
          >
            {createLoading ? "Creating..." : "Create Test"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
