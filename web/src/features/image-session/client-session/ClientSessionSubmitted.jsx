import { useState } from "react";
import {
  Alert,
  Button,
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Fade,
  useTheme,
  alpha,
} from "@mui/material";
import {
  MdCheckCircleOutline as CheckCircleOutlined,
  MdDownload as DownloadOutlined,
  MdPalette as PaletteOutlined,
  MdRoom as RoomOutlined,
  MdContentCopy as ContentCopyOutlined,
  MdVisibility as VisibilityOutlined,
  MdStyle,
} from "react-icons/md";

import { ClientSelectedImages } from "@/features/image-session/client-session/ClientSelectedImages.jsx";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { PreviewItem } from "@/features/image-session/client-session/PreviewItem.jsx";
import { SiMaterialformkdocs } from "react-icons/si";
import { ClientSessionSubmittedSkeleton } from "@/features/image-session/client-session/ClientSessionSubmittedSkeleton.jsx";

export function ClientSessionSubmitted({ session, loading }) {
  const { lng } = useLanguageSwitcherContext();
  const theme = useTheme();

  // Content is visible by default now — no animation gates it. (The success
  // ripple is a pure-CSS flourish shown once the screen mounts.)
  const [isVisible] = useState(true);

  const PDF_GENERATION_ALERT = {
    en: "An error occurred while generating the PDF, or you may have closed the page during the process. Please contact customer support.",
    ar: "حدثت مشكلة أثناء توليد ملف الـ PDF، أو ربما قمت بإغلاق الصفحة أثناء التحميل. تواصل مع خدمة العملاء.",
  };

  const TEXTS = {
    en: {
      saved: "Saved!",
      selectionsSuccessful: "Your selections have been saved successfully.",
      downloadPDF: "Download PDF",
      selectedSpaces: "Selected Spaces",
      selectedColors: "Selected Colors",
      selectedMaterial: "Selected Materials",
      designStyle: "Design Style",
      shareSession: "Share Session",
      copyLink: "Copy Link",
      viewDetails: "View Details",
      addToFavorites: "Add to Favorites",
      linkCopied: "Link copied to clipboard!",
    },
    ar: {
      saved: "تم الحفظ!",
      selectionsSuccessful: "تم حفظ اختياراتك بنجاح.",
      downloadPDF: "تحميل الملف",
      selectedSpaces: "المساحات المختارة",
      selectedColors: "الألوان المختارة",
      selectedMaterial: "الخامات المختارة",
      designStyle: "نمط التصميم",
      shareSession: "مشاركة الجلسة",
      copyLink: "نسخ الرابط",
      viewDetails: "عرض التفاصيل",
      addToFavorites: "إضافة للمفضلة",
      linkCopied: "تم نسخ الرابط!",
    },
  };

  if (loading) {
    return <ClientSessionSubmittedSkeleton />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        elevation={6}
        sx={{
          p: 4,
          mb: 4,
          textAlign: "center",
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.success.main,
            0.1
          )}, ${alpha(theme.palette.success.main, 0.05)})`,
          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
          borderRadius: 3,
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`,
          },
        }}
      >
        {/* Success Icon with Animation */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
            position: "relative",
          }}
        >
          <CheckCircleOutlined
            sx={{
              fontSize: 56,
              color: theme.palette.success.main,
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.1))",
            }}
          />
          {isVisible && (
            <Box
              sx={{
                position: "absolute",
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
                animation: "ripple 2s infinite",
                "@keyframes ripple": {
                  "0%": { transform: "scale(0.8)", opacity: 1 },
                  "100%": { transform: "scale(1.5)", opacity: 0 },
                },
              }}
            />
          )}
        </Box>

        <Typography
          variant="h3"
          component="h1"
          sx={{
            color: theme.palette.success.main,
            fontWeight: 700,
            mb: 1,
            maxWidth: 600,
            mx: "auto",
            textShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {TEXTS[lng].saved}
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: theme.palette.text.secondary,
            mb: 3,
            maxWidth: 600,
            mx: "auto",
          }}
        >
          {TEXTS[lng].selectionsSuccessful}
        </Typography>
      </Paper>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {session.selectedSpaces && session.selectedSpaces.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              elevation={3}
              sx={{
                height: "100%",
                borderRadius: 3,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                "&:hover": {
                  transform: "translateY(-8px) scale(1.02)",
                  boxShadow: theme.shadows[12],
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ mb: 3 }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <RoomOutlined
                      sx={{ color: theme.palette.primary.main, fontSize: 28 }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
                  >
                    {TEXTS[lng].selectedSpaces}
                  </Typography>
                </Stack>

                <Stack direction="row" flexWrap="wrap" gap={1.5}>
                  {session.selectedSpaces.map((spaceRelation, index) => (
                    <Chip
                      key={index}
                      label={
                        spaceRelation.space.title.find(
                          (t) => t.language.code === lng
                        )?.text || "Unknown Space"
                      }
                      variant="outlined"
                      size="medium"
                      sx={{
                        borderRadius: 3,
                        fontWeight: 500,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          transform: "scale(1.05)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Selected Colors */}
        {session.customColors && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              elevation={3}
              sx={{
                height: "100%",
                borderRadius: 3,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                "&:hover": {
                  transform: "translateY(-8px) scale(1.02)",
                  boxShadow: theme.shadows[12],
                  border: `1px solid ${alpha(
                    theme.palette.secondary.main,
                    0.3
                  )}`,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ mb: 3 }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PaletteOutlined
                      sx={{ color: theme.palette.secondary.main, fontSize: 28 }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.secondary.main,
                      fontWeight: 600,
                    }}
                  >
                    {TEXTS[lng].selectedColors}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1.5} flexWrap="wrap">
                  {session.customColors.map((color, index) => (
                    <Box
                      key={color + index}
                      sx={{
                        backgroundColor: color,
                        height: 40,
                        width: 40,
                        borderRadius: 2,
                        border: `2px solid ${alpha(
                          theme.palette.divider,
                          0.2
                        )}`,
                        boxShadow: theme.shadows[2],
                        transition: "all 0.2s ease",
                        "&:hover": {
                          transform: "scale(1.2)",
                          boxShadow: theme.shadows[6],
                        },
                      }}
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Selected Material */}
        {session.materials && session.materials.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              elevation={3}
              sx={{
                height: "100%",
                borderRadius: 3,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                "&:hover": {
                  transform: "translateY(-8px) scale(1.02)",
                  boxShadow: theme.shadows[12],
                  border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ mb: 3 }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SiMaterialformkdocs
                      sx={{ color: theme.palette.info.main, fontSize: 28 }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ color: theme.palette.info.main, fontWeight: 600 }}
                  >
                    {TEXTS[lng].selectedMaterial}
                  </Typography>
                </Stack>

                {session.materials.map((materialSession) => (
                  <PreviewItem
                    key={materialSession.id}
                    item={materialSession.material}
                    template={materialSession.material.template}
                    type="MATERIAL"
                    extraLng={lng}
                  />
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Design Style */}
        {session.style && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              elevation={3}
              sx={{
                height: "100%",
                borderRadius: 3,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                "&:hover": {
                  transform: "translateY(-8px) scale(1.02)",
                  boxShadow: theme.shadows[12],
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ mb: 3 }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <VisibilityOutlined
                      sx={{ color: theme.palette.warning.main, fontSize: 28 }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ color: theme.palette.warning.main, fontWeight: 600 }}
                  >
                    {TEXTS[lng].designStyle}
                  </Typography>
                </Stack>

                <PreviewItem
                  item={session.style}
                  template={session.style.template}
                  type="STYLE"
                  extraLng={lng}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Enhanced Selected Images Component */}
      <Fade in={true} timeout={1000}>
        <Box>
          <ClientSelectedImages
            session={session}
            loading={loading}
            withActions={false}
          />
        </Box>
      </Fade>
    </Container>
  );
}
