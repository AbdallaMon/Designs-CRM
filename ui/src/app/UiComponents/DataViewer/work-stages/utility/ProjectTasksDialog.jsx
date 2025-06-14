"use client";
import {
  AppBar,
  Button,
  CardContent,
  Container,
  Dialog,
  DialogContent,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import { MdClose, MdList } from "react-icons/md";
import { TasksList } from "../../utility/TasksList";
import { StyledCard } from "../projects/ProjectDetails";
import { useState } from "react";

export const ProjectTasksDialog = ({
  project,
  type = "PROJECT",
  text = "View Project Tasks",
  simple,
}) => {
  const [tasksDialogOpen, setTasksDialogOpen] = useState(false);
  return (
    <>
      {simple ? (
        <div>
          <Button
            variant="contained"
            color="primary"
            // startIcon={<MdList />}
            fullWidth
            onClick={() => setTasksDialogOpen(true)}
            size="medium"
            sx={{ py: 1.5 }}
          >
            {text}
          </Button>
        </div>
      ) : (
        <StyledCard sx={{ mt: 3, overflow: "hidden" }}>
          <CardContent sx={{ p: 1 }}>
            <Button
              variant="contained"
              color="primary"
              // startIcon={<MdList />}
              fullWidth
              onClick={() => setTasksDialogOpen(true)}
              size="medium"
              sx={{ py: 1.5 }}
            >
              {text}
            </Button>
          </CardContent>
        </StyledCard>
      )}

      <Dialog
        fullScreen
        open={tasksDialogOpen}
        onClose={() => setTasksDialogOpen(false)}
      >
        <AppBar position="sticky" elevation={2}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setTasksDialogOpen(false)}
              aria-label="close"
              sx={{ mr: 2 }}
            >
              <MdClose />
            </IconButton>
            <Typography
              variant="h6"
              component="div"
              sx={{ flex: 1, fontWeight: 600 }}
            >
              <IconButton
                component="a"
                href={`/dashbaord/projects/${project.id}`}
              >
                #{project.id}
              </IconButton>
              {type === "MODIFICATION"
                ? "PROJECT MODIFICATIONS"
                : "Project Tasks"}
            </Typography>
          </Toolbar>
        </AppBar>
        <DialogContent sx={{ p: 3, bgcolor: "#f9fafb" }}>
          <Container maxWidth="lg" sx={{ py: 2 }}>
            <TasksList
              projectId={project.id}
              type={type}
              name={type === "MODIFICATION" ? "Modification" : "Task"}
            />
          </Container>
        </DialogContent>
      </Dialog>
    </>
  );
};
