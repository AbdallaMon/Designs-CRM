import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Divider,
  Grid,
  Paper,
} from "@mui/material";
import { FiBookOpen, FiVideo, FiFileText } from "react-icons/fi";
import LoadingOverlay from "@/shared/components/feedback/loaders/LoadingOverlay";

const HomeworkRequirementsDialog = ({
  homeworkDialog,
  setHomeworkDialog,
  loading,
  handleUploadClick,
  theme,
  hasVideo,
  hasSummary,
  videoHomeworks,
  summaryHomeworks,
  homeworks,
}) => {
  return (
    <Dialog
      open={homeworkDialog}
      onClose={() => setHomeworkDialog(false)}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: "70vh",
          "&.MuiPaper-root": {
            margin: 2,
            width: "100%",
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }} dir="rtl">
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: "primary.light",
              color: "primary.contrastText",
            }}
          >
            <FiBookOpen size={20} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            الواجبات
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ position: "relative", px: 2 }} dir="rtl">
        {loading && <LoadingOverlay />}

        {/* Quick Actions */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 0, fontWeight: 600 }}>
              قدم عملك
            </Typography>
            <Typography variant="caption" sx={{ mb: 2 }}>
              يجب رفع ملخص واحد على الأقل بصيغة PDF وفيديو واحد
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "no-wrap" }}>
            <Button
              variant="outlined"
              startIcon={<FiVideo />}
              onClick={() => handleUploadClick("VIDEO")}
              size="large"
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 3,
                py: 1.5,
                borderWidth: 2,
                "&:hover": {
                  borderWidth: 2,
                  bgcolor: "primary.light",
                  color: "primary.contrastText",
                },
              }}
            >
              رفع فيديو
            </Button>
            <Button
              variant="outlined"
              startIcon={<FiFileText />}
              onClick={() => handleUploadClick("SUMMARY")}
              color="secondary"
              size="large"
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 3,
                py: 1.5,
                borderWidth: 2,
                "&:hover": {
                  borderWidth: 2,
                  bgcolor: "secondary.light",
                  color: "secondary.contrastText",
                },
              }}
            >
              رفع ملخص
            </Button>
          </Box>
        </Box>

        <Grid container spacing={{ xs: 1.5, md: 3 }} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6 }}>
            <Card
              sx={{
                height: "100%",
                background: hasVideo
                  ? "linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)"
                  : "inherit",
                border: hasVideo
                  ? `1px solid ${theme.palette.primary.light}`
                  : "1px solid #e0e0e0",
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    p: 2,
                    borderRadius: 3,
                    bgcolor: hasVideo ? "primary.light" : "grey.100",
                    color: hasVideo ? "primary.contrastText" : "grey.600",
                    mb: 2,
                  }}
                >
                  <FiVideo size={24} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {videoHomeworks.length}
                </Typography>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  مقاطع الفيديو المقدمة
                </Typography>
                <Chip
                  label={hasVideo ? "مكتمل" : "مطلوب"}
                  color={hasVideo ? "primary" : "default"}
                  variant={hasVideo ? "filled" : "outlined"}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Card
              sx={{
                height: "100%",
                background: hasSummary
                  ? "linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(156, 39, 176, 0.05) 100%)"
                  : "inherit",
                border: hasSummary
                  ? `1px solid ${theme.palette.secondary.light}`
                  : "1px solid #e0e0e0",
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    p: 2,
                    borderRadius: 3,
                    bgcolor: hasSummary ? "secondary.light" : "grey.100",
                    color: hasSummary ? "secondary.contrastText" : "grey.600",
                    mb: 2,
                  }}
                >
                  <FiFileText size={24} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {summaryHomeworks.length}
                </Typography>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  الملخصات المقدمة
                </Typography>
                <Chip
                  label={hasSummary ? "مكتمل" : "مطلوب"}
                  color={hasSummary ? "secondary" : "default"}
                  variant={hasSummary ? "filled" : "outlined"}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Submissions List */}
        <Paper
          sx={{ p: { xs: 1.5, md: 3 }, borderRadius: 3, bgcolor: "grey.50" }}
        >
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            مقدماتك
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={40} />
            </Box>
          ) : homeworks.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                لا توجد مقدمات بعد
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ارفع ملفات واجباتك للبدء
              </Typography>
            </Box>
          ) : (
            <List sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
              {homeworks.map((homework, index) => {
                return (
                  <React.Fragment key={homework.id}>
                    <ListItem sx={{ py: 2 }}>
                      <ListItemIcon>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor:
                              homework.type === "VIDEO"
                                ? "primary.light"
                                : "secondary.light",
                            color:
                              homework.type === "VIDEO"
                                ? "primary.contrastText"
                                : "secondary.contrastText",
                          }}
                        >
                          {homework.type === "VIDEO" ? (
                            <FiVideo size={20} />
                          ) : (
                            <FiFileText size={20} />
                          )}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, mb: 1 }}
                          >
                            {homework.title}
                          </Typography>
                        }
                        secondary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Chip
                              label={
                                homework.type === "VIDEO" ? "فيديو" : "ملخص"
                              }
                              size="small"
                              color={
                                homework.type === "VIDEO"
                                  ? "primary"
                                  : "secondary"
                              }
                              variant="outlined"
                            />
                            <Button
                              component="a"
                              target="_blank"
                              href={homework.url}
                              variant="contained"
                              size="small"
                              sx={{
                                textTransform: "none",
                                borderRadius: 1.5,
                              }}
                            >
                              عرض الملف
                            </Button>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < homeworks.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={() => setHomeworkDialog(false)}
          variant="outlined"
          sx={{
            textTransform: "none",
            px: 3,
            borderRadius: 2,
          }}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HomeworkRequirementsDialog;
