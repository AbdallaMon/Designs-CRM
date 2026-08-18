"use client";

import Link from "next/link";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { getErrorPresentation } from "../config/errorPresentation";

export default function GenericErrorPage({ code, status }) {
  const error = getErrorPresentation({ code, status });

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "#f6f7fb",
        py: 6,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          role="alert"
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 4,
            p: { xs: 3, sm: 5 },
            textAlign: "center",
          }}
        >
          <Stack spacing={2.5} alignItems="center">
            <Box
              aria-hidden="true"
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(211, 47, 47, 0.08)",
                color: "error.main",
                border: "1px solid",
                borderColor: "error.light",
                fontSize: 32,
                fontWeight: 700,
              }}
            >
              !
            </Box>

            <Stack spacing={1}>
              <Typography component="h1" variant="h4" fontWeight={700}>
                {error.title}
              </Typography>
              <Typography variant="h6" color="text.primary">
                {error.message}
              </Typography>
              <Typography color="text.secondary">
                {error.description}
              </Typography>
            </Stack>

            <Button
              component={Link}
              href={error.actionHref}
              variant="contained"
              size="large"
              sx={{ minWidth: 190 }}
            >
              {error.actionLabel}
            </Button>

            <Typography variant="caption" color="text.disabled">
              Reference: {error.code} · HTTP {error.status}
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
