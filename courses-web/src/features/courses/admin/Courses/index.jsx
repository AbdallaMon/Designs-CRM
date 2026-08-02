"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  AppBar,
  Toolbar,
  Container,
} from "@mui/material";
import CreateCourse from "../CreateNewCourse";
import { initialPageLimit } from "@/app/helpers/constants";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import FullScreenLoader from "@/shared/components/feedback/loaders/FullscreenLoader";
import PaginationWithLimit from "@/shared/components/common/PaginationWithLimit";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import CourseCard from "./components/CourseCard";
import EditCourseDialog from "./components/EditCourseDialog";

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
  });
  async function getCourses() {
    await getDataAndSet({
      url: "courses",
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
      `courses/${selectedCourse.id}`,
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
            <CourseCard
              key={course.id}
              course={course}
              onEdit={handleEditClick}
            />
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

      <EditCourseDialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={handleSaveEdit}
        toastLoading={toastLoading}
      />
    </Box>
  );
}
