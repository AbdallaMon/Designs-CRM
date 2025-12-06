"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
  CircularProgress,
  Paper,
  Alert,
  Container,
} from "@mui/material";

import { RelatedLinks } from "../utility/RelatedLinks";
import { getData } from "@/app/helpers/functions/getData";
import {
  MdAccessTime,
  MdCalendarToday,
  MdDescription,
  MdInfo,
  MdPerson,
  MdPriorityHigh,
  MdTask,
} from "react-icons/md";
import dayjs from "dayjs";
import { TaskActions } from "./TaskActions";
import { NotesComponent } from "../utility/Notes";
export default function TaskDetails({ id, showBackButton = true }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchTaskData() {
      const res = await getData({
        url: `shared/tasks/${id}`,
        setLoading,
      });
      if (res && res.status === 200) {
        setTask(res.data);
      }
    }

    fetchTaskData();
  }, [id]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!task) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="info"
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: 2,
            boxShadow: 1,
            fontSize: "1.1rem",
          }}
        >
          This task is not available or you don&apos;t have permission to view
          it.
        </Alert>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          {showBackButton && (
            <Button variant="outlined" onClick={() => window.history.back()}>
              Go Back
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <MdTask />
            {task.type === "MODIFICATION" ? "Modification" : "Task"} Details
          </Box>
          <TaskActions
            name={task.type === "MODIFICATION" ? "Modification" : "Task"}
            setTask={setTask}
            task={task}
          />
          <NotesComponent
            idKey={"taskId"}
            id={task.id}
            slug="shared"
            showAddNotes={true}
          />
        </Box>
        {showBackButton && (
          <Button variant="outlined" onClick={() => window.history.back()}>
            Back
          </Button>
        )}
      </Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="h5" component="h2">
                  {task.title}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <MdDescription sx={{ mr: 1 }} />
                <Typography variant="body1">
                  <strong>Description:</strong>{" "}
                  {task.description || "No description provided"}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <MdInfo sx={{ mr: 1 }} />
                <Typography variant="body1">
                  <strong>Type:</strong> {task.type}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <MdCalendarToday sx={{ mr: 1 }} />
                <Typography variant="body1">
                  <strong>Created:</strong>{" "}
                  {dayjs(task.createdAt).format("DD/MM/YYYY")}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <MdAccessTime sx={{ mr: 1 }} />
                <Typography variant="body1">
                  <strong>Due Date:</strong>{" "}
                  {task.dueDate
                    ? dayjs(task.dueDate).format("DD/MM/YYYY")
                    : "No due date"}
                </Typography>
              </Box>

              {task.finishedAt && (
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <MdAccessTime sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Finished At:</strong>{" "}
                    {dayjs(task.finishedAt).format("DD/MM/YYYY")}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              <MdPerson sx={{ mr: 1, verticalAlign: "middle" }} />
              Assignment Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                <strong>Assigned To:</strong>{" "}
                {task.user?.name || "Not assigned"}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                <strong>Created By:</strong> {task.createdBy?.name || "Unknown"}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RelatedLinks
            projectId={task.projectId}
            clientLeadId={task.clientLeadId}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
