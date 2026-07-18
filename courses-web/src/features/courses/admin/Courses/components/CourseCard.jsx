"use client";
import React from "react";
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
} from "@mui/material";
import {
  MdEdit,
  MdPlayArrow,
  MdQuiz,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import Link from "next/link";
import { ROLE_LABELS } from "@/app/helpers/constants";
import { getRoleColor } from "../helpers";

// One admin course card: banner, published state, counts, role chips, and the
// Edit / Lessons / Tests actions. `onEdit` is called with the course on Edit.
export default function CourseCard({ course, onEdit }) {
  return (
    <Grid size={{ md: 6, lg: 4 }}>
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
            <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
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

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
              onClick={() => onEdit(course)}
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
  );
}
