import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Fade,
  Stack,
  Avatar,
  Tooltip,
} from "@mui/material";
import {
  MdLink as LinkIcon,
  MdOpenInNew as OpenInNew,
  MdLaunch,
} from "react-icons/md";

const LinkItem = ({ link }) => (
  <Fade in timeout={300} key={link.id}>
    <Box sx={{ mb: 3 }}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: (theme) => theme.shadows[4],
            transform: "translateY(-1px)",
          },
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={2} flex={1}>
              <Avatar sx={{ bgcolor: "info.main", width: 40, height: 40 }}>
                <MdLaunch />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {link.title}
                </Typography>
              </Box>
            </Stack>
            <Tooltip title="Open link in new tab">
              <Button
                variant="outlined"
                startIcon={<LinkIcon />}
                endIcon={<OpenInNew />}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  minWidth: 120,
                }}
              >
                Visit Link
              </Button>
            </Tooltip>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  </Fade>
);

export default LinkItem;
