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
  MdPictureAsPdf as PictureAsPdf,
  MdOpenInNew as OpenInNew,
  MdDescription,
} from "react-icons/md";

const PdfItem = ({ pdf, index }) => (
  <Fade in timeout={300} key={pdf.id}>
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
              <Avatar sx={{ bgcolor: "error.main", width: 40, height: 40 }}>
                <MdDescription />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  PDF {index + 1}
                </Typography>
              </Box>
            </Stack>
            <Tooltip title="Open PDF in new tab">
              <Button
                variant="outlined"
                startIcon={<PictureAsPdf />}
                endIcon={<OpenInNew />}
                href={pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  minWidth: 120,
                }}
              >
                Open PDF
              </Button>
            </Tooltip>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  </Fade>
);

export default PdfItem;
