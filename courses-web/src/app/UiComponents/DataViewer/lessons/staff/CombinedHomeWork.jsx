import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  useTheme,
} from "@mui/material";
import {
  FiBookOpen,
  FiVideo,
  FiFileText,
  FiUpload,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";

const CombinedHomeWork = ({ courseId, lessonId, onUpdate }) => {
  const [homeworkDialog, setHomeworkDialog] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadType, setUploadType] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setProgress, setOverlay } = useUploadContext();

  const { toastLoading: submitting, setToastLoading: setSubmitting } =
    useToastContext();
  const theme = useTheme();

  useEffect(() => {
    fetchHomeworks();
  }, []);

  const fetchHomeworks = async () => {
    await getDataAndSet({
      url: `shared/courses/${courseId}/lessons/${lessonId}/home-work`,
      setData: setHomeworks,
      setLoading,
    });
  };

  const handleUploadClick = (type) => {
    setUploadType(type);
    setUploadDialog(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !file) {
      return;
    }
    let url = "";
    const fileUpload = await uploadInChunks(file.file, setProgress, setOverlay);

    if (fileUpload.status === 200) {
      url = fileUpload.url;
    }

    const req = await handleRequestSubmit(
      { url, title, type: uploadType },
      setSubmitting,
      `shared/courses/${courseId}/lessons/${lessonId}/home-work`
    );
    if (req.status === 200) {
      onUpdate();
      handleCloseUploadDialog();
      await fetchHomeworks();
    }
  };

  const handleCloseUploadDialog = () => {
    setUploadDialog(false);
    setTitle("");
    setFile(null);
  };

  const videoHomeworks = homeworks.filter((hw) => hw.type === "VIDEO");
  const summaryHomeworks = homeworks.filter((hw) => hw.type === "SUMMARY");
  const hasVideo = videoHomeworks.length > 0;
  const hasSummary = summaryHomeworks.length > 0;
  const canProceed = hasSummary && hasVideo;

  return (
    <Box dir="rtl">
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: "text.primary" }}
          >
            واجبات الدرس
          </Typography>
          <Button
            variant="contained"
            startIcon={<FiBookOpen />}
            onClick={() => setHomeworkDialog(true)}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
              py: 1,
            }}
          >
            عرض المتطلبات
          </Button>
        </Box>

        {/* Status Card */}
        <Card
          sx={{
            background: canProceed
              ? "linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)"
              : "linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)",
            border: `1px solid ${
              canProceed
                ? theme.palette.success.light
                : theme.palette.warning.light
            }`,
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {canProceed ? (
                <FiCheck size={24} color={theme.palette.success.main} />
              ) : (
                <FiAlertCircle size={24} color={theme.palette.warning.main} />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  {canProceed ? "تم إكمال جميع المتطلبات!" : "الواجب مطلوب"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {canProceed
                    ? "يمكنك الآن الانتقال إلى الدرس التالي أو الاختبار."
                    : `يجب تقديم ملخص بصيغة PDF وفيديو للمتابعة.`}
                </Typography>
              </Box>
              {canProceed && (
                <Chip
                  label="جاهز"
                  color="success"
                  variant="filled"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Main Homework Dialog */}
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

      {/* Enhanced Upload Dialog */}
      <Dialog
        open={uploadDialog}
        onClose={handleCloseUploadDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }} dir="rtl">
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor:
                  uploadType === "VIDEO" ? "primary.light" : "secondary.light",
                color:
                  uploadType === "VIDEO"
                    ? "primary.contrastText"
                    : "secondary.contrastText",
              }}
            >
              <FiUpload size={20} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              رفع {uploadType === "VIDEO" ? "فيديو" : "ملخص"}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: "24px !important" }} dir="rtl">
          <TextField
            fullWidth
            label="عنوان"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
            required
            placeholder={`أدخل عنواناً لـ${
              uploadType === "VIDEO" ? "الفيديو" : "الملخص"
            }`}
          />
          <SimpleFileInput
            id="file"
            setData={setFile}
            label={uploadType === "VIDEO" ? "اختر ملف فيديو" : "اختر مستند"}
            input={{
              accept: uploadType === "VIDEO" ? "video/*" : "application/pdf",
            }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleCloseUploadDialog}
            disabled={submitting}
            variant="outlined"
            sx={{
              textTransform: "none",
              px: 3,
              borderRadius: 2,
            }}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!title.trim() || !file || submitting}
            startIcon={
              submitting ? <CircularProgress size={16} /> : <FiUpload />
            }
            sx={{
              textTransform: "none",
              px: 3,
              borderRadius: 2,
            }}
          >
            {submitting ? "جاري الرفع..." : "رفع الملف"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CombinedHomeWork;
