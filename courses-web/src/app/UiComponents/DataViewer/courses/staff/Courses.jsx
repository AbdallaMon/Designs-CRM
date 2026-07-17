"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  AppBar,
  Toolbar,
  Container,
  Alert,
  CardActions,
  Button,
  Divider,
} from "@mui/material";

import { initialPageLimit } from "@/app/helpers/constants";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import PaginationWithLimit from "../../PaginationWithLimit";
import { useAuth } from "@/app/providers/AuthProvider";

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

export default function StaffCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialPageLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { user } = useAuth();

  async function getCourses() {
    await getDataAndSet({
      url: `shared/courses?role=${user.role}&`,
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

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={1}>
        {loading && <FullScreenLoader />}
        <Container maxWidth="lg">
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Courses
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
        {!loading && courses && courses.length === 0 && (
          <Alert severity="error">
            No Courses Available for your current role
          </Alert>
        )}
        <Grid container spacing={3}>
          {courses?.map((course) => (
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
                </CardContent>
                <Divider />
                <CardActions>
                  <Button
                    component="a"
                    href={`/dashboard/courses/${course.id}`}
                    variant="outlined"
                  >
                    Preview
                  </Button>
                </CardActions>
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
    </Box>
  );
}
