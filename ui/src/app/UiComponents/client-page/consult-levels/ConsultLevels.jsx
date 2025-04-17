"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Collapse,
  IconButton,
  Paper,
  Button,
  useMediaQuery,
  useTheme,
  Grid2 as Grid,
  Badge,
} from "@mui/material";
import { FaChevronDown, FaChevronUp, FaCheckCircle } from "react-icons/fa";
import { consultLevelsData, enConsultLevelsData } from "./data";
import colors from "@/app/helpers/colors";

export function ConsultLevels({ lng }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const data = lng === "ar" ? consultLevelsData : enConsultLevelsData;
  const [activeStage, setActiveStage] = useState(null);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          // height: "calc(100vh - 150px)",
          // maxHeight: 800,
          bgcolor: colors.bgSecondary,
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0px 5px 20px rgba(0, 0, 0, 0.15)",
        }}
      >
        <Box
          sx={{
            padding: { xs: 2, md: 3 },
            textAlign: "center",
            background: `linear-gradient(135deg, ${colors.primary}22, ${colors.bgSecondary})`,
            borderBottom: `1px solid ${colors.primary}33`,
          }}
        >
          <Typography
            variant="subtitle1"
            color={colors.secondaryText}
            fontSize={isMobile ? 18 : 22}
            fontWeight={600}
            sx={{ mt: 1 }}
          >
            {data.subTitle}
          </Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: { xs: 1.5, sm: 3 },
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: colors.primary + "99",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: colors.primary,
            },
          }}
        >
          {data.levels.map((level, index) => (
            <CollapsibleStage
              key={index}
              stage={level}
              isActive={activeStage === index}
              onClick={() =>
                setActiveStage(activeStage === index ? null : index)
              }
              number={index + 1}
            />
          ))}
          <Box sx={{ height: 80 }} />{" "}
        </Box>
      </Box>
    </>
  );
}

function CollapsibleStage({ stage, isActive, onClick, number }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Paper
      elevation={isActive ? 4 : 2}
      sx={{
        mb: 3,
        borderRadius: 2,
        overflow: "hidden",
        transition: "all 0.3s ease",
        width: "100%",
        borderLeft: isActive ? `4px solid ${colors.primary}` : "none",
        "&:hover": {
          boxShadow: 6,
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          bgcolor: isActive ? colors.primary + "0a" : "background.paper",
        }}
        onClick={onClick}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Badge
            badgeContent={number}
            color="primary"
            sx={{
              "& .MuiBadge-badge": {
                width: 28,
                height: 28,
                borderRadius: "50%",
                fontSize: 16,
              },
              display: { xs: "none", sm: "block" },
            }}
          />

          <Box>
            <Typography
              variant="h5"
              component="h2"
              fontWeight="bold"
              fontSize={isMobile ? 18 : 22}
              gutterBottom
            >
              {stage.title}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography
                variant="subtitle1"
                fontSize={isMobile ? 14 : 16}
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: isActive ? 100 : 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                <strong>{stage.description.bold}</strong>{" "}
                {stage.description.normal}
              </Typography>
            </Box>
          </Box>
        </Box>

        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          sx={{
            transition: "transform 0.3s, background-color 0.3s",
            transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
            bgcolor: colors.primary,
            color: "white",
            "&:hover": {
              bgcolor: colors.primary + "dd",
            },
            width: { xs: 32, sm: 40 },
            height: { xs: 32, sm: 40 },
            flexShrink: 0,
          }}
        >
          {isActive ? <FaChevronUp /> : <FaChevronDown />}
        </IconButton>
      </Box>

      <Collapse in={isActive} timeout={300}>
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            bgcolor: "background.default",
            borderTop: `1px solid ${colors.primary}22`,
          }}
        >
          <Grid container spacing={2}>
            {stage.details.map((detail, index) => (
              <Grid key={index}>
                <Card
                  elevation={1}
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${colors.primary}22`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: 3,
                      borderColor: colors.primary + "44",
                    },
                  }}
                >
                  <CardContent sx={{ display: "flex", gap: 2 }}>
                    <FaCheckCircle
                      color={colors.primary}
                      style={{ marginTop: 3, flexShrink: 0 }}
                    />
                    <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                      {detail}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
}
