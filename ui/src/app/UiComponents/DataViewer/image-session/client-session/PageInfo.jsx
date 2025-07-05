import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Skeleton,
  Paper,
  Divider,
  Stack,
  Fade,
  useTheme,
} from "@mui/material";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { PageInfoType } from "@/app/helpers/constants";
import { ActionButtons, ClientImageAppBar, NextButton } from "./Utility";

const PageInfoComponent = ({
  session,
  type,
  handleNext,
  handleBack,
  disabled,
}) => {
  const [pageInfo, setPageInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const { lng } = useLanguageSwitcherContext();
  const theme = useTheme();

  const isRTL = lng === "ar";

  useEffect(() => {
    const loadPageInfo = async () => {
      await getDataAndSet({
        url: `client/image-session/page-info?type=${type}&lng=${lng}&`,
        setData: setPageInfo,
        setLoading,
      });
    };

    loadPageInfo();
  }, [type, lng]);

  if (loading) {
    return (
      <>
        <Paper
          elevation={6}
          sx={{
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ p: 4 }}>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Skeleton
                variant="text"
                sx={{
                  fontSize: "2.5rem",
                  width: "60%",
                  mx: "auto",
                  bgcolor: theme.palette.action.hover,
                }}
              />
            </Box>
            <Divider
              sx={{ mb: 4, bgcolor: theme.palette.primary.main, height: 2 }}
            />
            <Stack spacing={2}>
              {[...Array(6)].map((_, index) => (
                <Skeleton
                  key={index}
                  variant="text"
                  sx={{
                    fontSize: "1.2rem",
                    width: index % 3 === 2 ? "80%" : "100%",
                    bgcolor: theme.palette.action.hover,
                  }}
                />
              ))}
            </Stack>
            <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
              <Skeleton
                variant="rounded"
                width={150}
                height={48}
                sx={{ bgcolor: theme.palette.action.hover }}
              />
            </Box>
          </Box>
        </Paper>
      </>
    );
  }

  return (
    <>
      <Fade in={!loading} timeout={800}>
        <Paper
          elevation={8}
          sx={{
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
            border: `1px solid ${theme.palette.divider}`,
            overflow: "hidden",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            },
          }}
        >
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ textAlign: "center", mt: 2, mb: 3 }}>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: `0 4px 8px ${theme.palette.primary.main}20`,
                  letterSpacing: "-0.5px",
                  lineHeight: 1.2,
                }}
              >
                {pageInfo?.title[0].text}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Divider
                sx={{
                  flex: 1,
                  bgcolor: theme.palette.primary.main,
                  height: 2,
                  borderRadius: 1,
                }}
              />
              <Box
                sx={{
                  mx: 2,
                  width: 12,
                  height: 12,
                  bgcolor: theme.palette.secondary.main,
                  borderRadius: "50%",
                  boxShadow: `0 0 0 4px ${theme.palette.secondary.main}20`,
                }}
              />
              <Divider
                sx={{
                  flex: 1,
                  bgcolor: theme.palette.primary.main,
                  height: 2,
                  borderRadius: 1,
                }}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography
                variant="body1"
                component="div"
                sx={{
                  color: theme.palette.text.primary,
                  fontSize: "1.2rem",
                  textAlign: isRTL ? "right" : "justify",
                  lineHeight: 1.8,
                  whiteSpace: "break-spaces",
                  letterSpacing: "0.3px",
                  fontWeight: 400,
                  "& p": {
                    marginBottom: "1.5rem",
                  },
                  direction: isRTL ? "rtl" : "ltr",
                }}
              >
                {pageInfo?.content[0].content}
              </Typography>
            </Box>

            <Box
              sx={{
                pt: 2,
              }}
            >
              <ActionButtons
                session={session}
                handleNext={handleNext}
                handleBack={handleBack}
                disabled={disabled}
              />
            </Box>
          </Box>
        </Paper>
      </Fade>
    </>
  );
};

export default PageInfoComponent;
