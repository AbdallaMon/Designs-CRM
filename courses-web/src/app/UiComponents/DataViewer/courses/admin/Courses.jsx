"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  AppBar,
  Toolbar,
  Container,
  Fab,
  CircularProgress,
  FormGroup,
  Checkbox,
} from "@mui/material";
import {
  MdAdd,
  MdEdit,
  MdPlayArrow,
  MdQuiz,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import CreateCourse from "./CreateNewCourse";
import {
  initialPageLimit,
  ROLE_LABELS,
  USER_ROLES,
} from "@/app/helpers/constants";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import Link from "next/link";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import PaginationWithLimit from "../../PaginationWithLimit";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";

const getRoleColor = (role) => {
  const colors = {
    STAFF: "#ff9800",
    THREE_D_DESIGNER: "#4caf50",
    TWO_D_DESIGNER: "#2196f3",
    ACCOUNTANT: "#9c27b0",
    SUPER_ADMIN: "#f44336",
  };
  return colors[role] || "#757575";
};

export default function CourseAdminPage() {
  const [courses, setCourses] = useState([]);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toastLoading, setToastLoading } = useToastContext();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialPageLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { setProgress, setOverlay } = useUploadContext();

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    imageUrl: null,
    isPublished: false,
    file: null,
    roles: null,
  });
  async function getCourses() {
    await getDataAndSet({
      url: `admin/courses`,
      setLoading,
      setData: setCourses,
      page,
      limit,
      setTotal,
      setTotalPages,
    });
  }
  useEffect(() => {
    getCourses();
  }, [page, limit]);
  const handleEditClick = (course) => {
    setSelectedCourse(course);
    setEditForm({
      title: course.title,
      description: course.description || "",
      imageUrl: course.imageUrl,
      isPublished: course.isPublished,
      file: null,
      roles: course.roles.map((r) => r.role),
    });
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (editForm.file) {
      const fileUpload = await uploadInChunks(
        editForm.file,
        setProgress,
        setOverlay
      );
      editForm.imageUrl = fileUpload.url;
    }
    delete editForm.file;
    const req = await handleRequestSubmit(
      editForm,
      setToastLoading,
      `admin/courses/${selectedCourse.id}`,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (req.status === 200) {
      setEditDialog(false);
      setSelectedCourse(null);
      await getCourses();
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={1}>
        {loading && <FullScreenLoader />}
        <Container maxWidth="lg">
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Course Administration
            </Typography>
            <PaginationWithLimit
              limit={limit}
              page={page}
              setLimit={setLimit}
              setPage={setPage}
              total={total}
              totalPages={totalPages}
            />
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h4" gutterBottom>
            Manage Courses
          </Typography>
          <CreateCourse onUpdate={getCourses} />
        </Box>

        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid size={{ md: 6, lg: 4 }} key={course.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 3,
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={course.imageUrl}
                  alt={course.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{ flexGrow: 1 }}
                    >
                      {course.title}
                    </Typography>
                    <IconButton size="small">
                      {course.isPublished ? (
                        <MdVisibility color="success" />
                      ) : (
                        <MdVisibilityOff color="disabled" />
                      )}
                    </IconButton>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {course.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Lessons:</strong> {course._count.lessons} |{" "}
                      <strong>Tests:</strong> {course._count.tests}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Roles:</strong>
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {course.roles.map((role) => (
                        <Chip
                          key={role}
                          label={ROLE_LABELS[role.role]}
                          size="small"
                          sx={{
                            backgroundColor: getRoleColor(role.role),
                            color: "white",
                            fontSize: "0.75rem",
                          }}
                        />
                      ))}
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<MdEdit />}
                      onClick={() => handleEditClick(course)}
                      sx={{ flex: 1, minWidth: "auto" }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<MdPlayArrow />}
                      sx={{ flex: 1, minWidth: "auto" }}
                      component={Link}
                      href={`/dashboard/courses/${course.id}/lessons`}
                    >
                      Lessons
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<MdQuiz />}
                      sx={{ flex: 1, minWidth: "auto" }}
                      component={Link}
                      href={`/dashboard/courses/${course.id}/tests`}
                    >
                      Tests
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <PaginationWithLimit
          limit={limit}
          page={page}
          setLimit={setLimit}
          setPage={setPage}
          total={total}
          totalPages={totalPages}
        />
      </Container>

      {/* Edit Course Dialog */}
      <Dialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            Edit Course
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.isPublished}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isPublished: e.target.checked })
                  }
                />
              }
              label="Published"
            />
          </Box>
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="Course Title"
            value={editForm.title}
            onChange={(e) =>
              setEditForm({ ...editForm, title: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={4}
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
            margin="normal"
          />
          <SimpleFileInput
            id="file"
            setData={setEditForm}
            label={"Change banner"}
            input={{ accept: "image/*" }}
          />
          {editForm.imageUrl && (
            <Box my={1}>
              old banner:
              <img src={editForm.imageUrl} height={200} width={200} />
            </Box>
          )}
          <FormGroup sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Roles</Typography>
            <Grid container spacing={2}>
              {Object.keys(USER_ROLES).map((role) => (
                <Grid key={role} size={{ xs: 6, md: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editForm?.roles?.includes(role)}
                        onChange={(e) => {
                          const updatedRoles = e.target.checked
                            ? [...editForm.roles, role]
                            : editForm.roles.filter((r) => r !== role);
                          setEditForm({ ...editForm, roles: updatedRoles });
                        }}
                      />
                    }
                    label={ROLE_LABELS[role]}
                  />
                </Grid>
              ))}
            </Grid>
          </FormGroup>
          =
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>

          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={toastLoading}
            startIcon={
              toastLoading ? <CircularProgress size={20} /> : <MdEdit />
            }
          >
            {toastLoading ? "Saving..." : "Save Course"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
