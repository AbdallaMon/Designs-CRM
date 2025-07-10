import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Container,
  Paper,
  Typography,
  Box,
  Grid2 as Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Fade,
  Skeleton,
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

import { ClientSelectedImages } from "./ClientSelectedImages";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { PreviewItem } from "./PreviewItem";
import { SiMaterialformkdocs } from "react-icons/si";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export function ClientSessionSubmitted({ session, loading }) {
  const { lng } = useLanguageSwitcherContext();
  const theme = useTheme();

  const [isVisible, setIsVisible] = useState(false);

  const PDF_GENERATION_ALERT = {
    en: "We're currently generating your PDF. You'll receive an email with the download link as soon as it's ready.",
    ar: "نقوم حاليًا بإنشاء ملف الـ PDF الخاص بك. ستتلقى رسالة بريد إلكتروني تحتوي على رابط التنزيل بمجرد أن يصبح جاهزًا.",
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

  const cardsRef = useRef([]);
  const titleRef = useRef();
  const selectionCardsRef = useRef([]);
  const containerRef = useRef();

  // Enhanced animation with scroll trigger
  useEffect(() => {
    if (session && !loading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.set([...cardsRef.current, ...selectionCardsRef.current], {
          opacity: 0,
          y: 60,
          scale: 0.95,
          rotationX: 10,
          transformOrigin: "center bottom",
          filter: "blur(5px)",
        });

        gsap.set(titleRef.current, {
          opacity: 0,
          y: -40,
          scale: 0.9,
          filter: "blur(3px)",
        });

        // Title animation with scroll trigger
        gsap.to(titleRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "back.out(1.4)",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
            onEnter: () => setIsVisible(true),
          },
        });

        // Selection cards with staggered scroll animation
        selectionCardsRef.current.forEach((card, index) => {
          if (card) {
            gsap.to(card, {
              opacity: 1,
              y: 0,
              scale: 1,
              rotationX: 0,
              filter: "blur(0px)",
              duration: 0.7,
              delay: index * 0.15,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card,
                start: "top 85%",
                end: "bottom 15%",
                toggleActions: "play none none reverse",
              },
            });
          }
        });

        // Main cards animation
        cardsRef.current.forEach((card, index) => {
          if (card) {
            gsap.to(card, {
              opacity: 1,
              y: 0,
              scale: 1,
              rotationX: 0,
              filter: "blur(0px)",
              duration: 0.6,
              delay: index * 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: card,
                start: "top 90%",
                end: "bottom 10%",
                toggleActions: "play none none reverse",
              },
            });
          }
        });
      }, containerRef);

      return () => ctx.revert();
    }
  }, [session, loading]);

  const addToRefs = (el, refsArray) => {
    if (el && !refsArray.current.includes(el)) {
      refsArray.current.push(el);
    }
  };

  const handleDownload = async () => {
    if (!session.pdfUrl) return;

    // Actual download
    window.open(session.pdfUrl, "_blank");
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Skeleton
            variant="circular"
            width={48}
            height={48}
            sx={{ mx: "auto", mb: 2 }}
          />
          <Skeleton variant="text" height={60} sx={{ mb: 2 }} />
          <Skeleton variant="text" height={40} />
        </Paper>
        <Grid container spacing={3}>
          {[...Array(4)].map((_, index) => (
            <Grid size={{ xs: 12, md: 6 }} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" height={40} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" height={60} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }} ref={containerRef}>
      <Paper
        ref={titleRef}
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

        {/* Action Buttons */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
          sx={{ mt: 3 }}
        >
          {/* PDF Download */}
          {session.pdfUrl ? (
            <Button
              variant="contained"
              startIcon={<DownloadOutlined />}
              onClick={handleDownload}
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "1.1rem",
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: theme.shadows[4],
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              {TEXTS[lng].downloadPDF}
            </Button>
          ) : (
            <Alert
              severity="info"
              sx={{
                maxWidth: 600,
                mx: "auto",
                borderRadius: 2,
                "& .MuiAlert-icon": {
                  fontSize: 24,
                },
              }}
            >
              {PDF_GENERATION_ALERT[lng]}
            </Alert>
          )}
        </Stack>
      </Paper>

      {/* Enhanced Selection Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Selected Spaces */}
        {session.selectedSpaces && session.selectedSpaces.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              ref={(el) => addToRefs(el, selectionCardsRef)}
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
              ref={(el) => addToRefs(el, selectionCardsRef)}
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
              ref={(el) => addToRefs(el, selectionCardsRef)}
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
              ref={(el) => addToRefs(el, selectionCardsRef)}
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
            cardsRef={cardsRef}
            titleRef={titleRef}
            loading={loading}
            withActions={false}
          />
        </Box>
      </Fade>
    </Container>
  );
}
