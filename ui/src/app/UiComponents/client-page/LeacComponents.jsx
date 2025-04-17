"use client";
import {
  Box,
  Container,
  MenuItem,
  Select,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useLanguageContext } from "@/app/providers/LanguageProvider.jsx";
import {
  consultationLead,
  designLead,
  designLeadTypes,
  leads,
  questions,
} from "@/app/UiComponents/client-page/clientPageData.js";
import { LeadType } from "@/app/helpers/constants.js";
import colors from "@/app/helpers/colors.js";
import React from "react";
import { IoArrowBackOutline } from "react-icons/io5";

export function LeadCardsContainer({ handleClick, isCatAnimated }) {
  const { translate } = useLanguageContext();
  const theme = useTheme();

  return (
    <Box className="leads-cards-container">
      <Title
        title={translate(questions.category)}
        class_name={"category-title"}
      />
      <Box>
        {leads.map((lead) => {
          return (
            <LeadCard
              key={lead.value}
              lead={lead}
              handleClick={handleClick}
              isCatAnimated={isCatAnimated}
            />
          );
        })}
      </Box>
    </Box>
  );
}
export function DesignLeadsContainer({ handleClick }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { translate } = useLanguageContext();
  const items = !isMobile
    ? [
        {
          title: "Out side UAE",
          value: "OUTSIDE_UAE",
          image: "/outside-uae.jpg",
          alt: "Dream studio create your dream design inside UAE",
        },
        {
          title: "Inside UAE",
          value: "INSIDE_UAE",
          image: "/inside-uae.webp",
          alt: "Dream Studio - Dream Design & Luxurious Home Solutions.",
        },
      ]
    : designLeadTypes;
  return (
    <Box
      className="design-cards-container"
      sx={{ mt: isMobile ? "-700px" : "-540px" }}
    >
      <Title
        title={translate(questions.category)}
        class_name={"design-title"}
      />
      <Box>
        {items.map((lead) => {
          return (
            <LeadCard
              key={lead.value}
              lead={lead}
              handleClick={handleClick}
              class_name="location"
            />
          );
        })}
      </Box>
    </Box>
  );
}
export function LeadCard({
  lead,
  handleClick,
  class_name = "lead-card",
  isCatAnimated,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { translate } = useLanguageContext();

  function renderContent() {
    return (
      <Box
        className={"shadow-" + class_name}
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          borderRadius: "12px",
          display: "inline-block",
          cursor: "pointer",
          boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.2)",
          backgroundColor: "#fff",
          overflow: "hidden",
        }}
      >
        <img src={lead.image} alt={lead.alt} />
        <Box
          className="lead-card-image"
          sx={{
            position: "absolute",
            height: "100%",
            width: "100%",
            backgroundImage: `url(${lead.image || "/design.jpg"})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            top: 0,
            cursor: "pointer",

            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              height: "100%",
              width: "100%",
              zIndex: 2,
              background:
                "linear-gradient(169deg, rgba(45, 35, 30, 0.3) 0%, rgba(45, 35, 30, 0.85) 100%)",
            }}
          >
            {lead.type === "COMING_SOON" && (
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  textAlign: "center",
                  position: "absolute",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  whiteSpace: "nowrap",
                  height: "50px",
                  zIndex: 3000,
                  bottom: "0",
                  left: "50%",
                  transform: "translate(-50%, -0%)",
                  bgcolor: "rgba(0,0,0,0.5)",
                  color: "white",
                }}
              >
                {translate("Coming Soon")}
              </Typography>
            )}
          </Box>
        </Box>
        <Typography
          variant="h4"
          sx={{
            fontSize: isMobile && "1.8rem",
            color: theme.palette.primary.main,
            fontWeight: 700,
            textAlign: "center",
            letterSpacing: "0.5px",
            position: "absolute",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "fit-content",
            whiteSpace: "nowrap",
            height: "fit-content",
            zIndex: 3000,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {translate(lead.title)}
        </Typography>
      </Box>
    );
  }
  if (lead.type === "LINK") {
    return (
      <Box
        className={`${class_name} ${lead.value}`}
        component="a"
        href={lead.href}
        target="_blank"
        onClick={(e) => {
          if (isCatAnimated) {
            e.preventDefault();
            return;
          }
        }}
        onContextMenu={(e) => {
          if (isCatAnimated) {
            e.preventDefault();
            return;
          }
        }}
        rel="noreferrer"
        sx={{
          position: "relative",
          minHeight: isMobile ? "180px" : "200px",
          width: isMobile ? "100%" : "calc( 50% - 24px )",
          display: "inline-block",
          cursor: "pointer",
          my: isMobile ? "8px" : "8px",
          mx: isMobile ? 0 : "12px",
          overflow: "hidden",
          zIndex: class_name === "location" && 15,
        }}
      >
        {renderContent()}
      </Box>
    );
  }
  return (
    <Box
      className={`${class_name} ${lead.value}`}
      onClick={() => handleClick(lead.value)}
      sx={{
        opacity: class_name === "location" ? 0 : 1,
        position: "relative",
        minHeight: isMobile ? "180px" : "200px",
        width: isMobile ? "100%" : "calc( 50% - 24px )",
        display: "inline-block",
        cursor: "pointer",
        my: isMobile ? "8px" : "8px",

        mx: isMobile ? 0 : "12px",
        overflow: "hidden",
        zIndex: class_name === "location" && 15,
      }}
    >
      {renderContent()}
    </Box>
  );
}

export function LeadCategoryItemsContainer({
  location,
  leadCategory,
  animateLeadCategoryItems,
}) {
  const { translate } = useLanguageContext();
  const leadsItems = leadCategory === "DESIGN" ? designLead : consultationLead;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  return (
    <Box
      sx={{
        mt: isMobile
          ? location
            ? "-550px"
            : "-500px"
          : location
          ? "-350px"
          : "-300px",
      }}
    >
      <Title title={translate(questions.type)} class_name={"item-title"} />
      <Box sx={{ display: "flex", flexDirection: { xs: "column" }, gap: 2 }}>
        {leadsItems.map((item) => {
          return (
            <LeadCategoryItem
              key={item.value}
              title={translate(LeadType[item.value])}
              value={item.value}
              animateLeadCategoryItems={
                !location ? () => null : animateLeadCategoryItems
              }
              subtitle={item.subtext}
            />
          );
        })}
      </Box>
    </Box>
  );
}

export function LeadCategoryItem({
  title,
  value,
  animateLeadCategoryItems,
  subtitle,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  return (
    <Box
      sx={{
        width: "100%",
        padding: isMobile ? "16px" : "24px",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        backgroundColor: colors.bgPrimary,
        textAlign: "center",
        fontWeight: 500,
        opacity: 0,
        cursor: "pointer",
      }}
      onClick={() => animateLeadCategoryItems(value)}
      className={"lead-item"}
    >
      <Typography variant="h5" sx={{ fontWeight: 500 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 400,
            color: "inherit",
          }}
        >
          {subtitle + " AED"}
        </Typography>
      )}
    </Box>
  );
}

export function Title({ title, class_name }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Typography
      variant="h4"
      className={class_name}
      sx={{
        textAlign: "center",
        fontWeight: 700,
        color: theme.palette.primary.main,
        mb: 1,
        mt: 4.5,
        opacity: 0,
        minHeight: "80px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize:
          isMobile &&
          (class_name === "design-title" || class_name === "item-title") &&
          "1.75rem",
      }}
    >
      {title}
    </Typography>
  );
}
export function Header({ reverseAnimation }) {
  const theme = useTheme();
  const { lng, changeLanguage } = useLanguageContext();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Container
      position="fixed"
      elevation={0}
      maxWidth="md"
      sx={{
        top: 8,
        left: 0,
        right: 0,
        position: "fixed",
        zIndex: 30,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          background: theme.palette.background.paper,
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          margin: "0 12px",
          backgroundImage: "url('/logo-bg-full.jpg')", // Replace with your image URL
          backgroundSize: "cover", // Ensures the image covers the entire container
          backgroundRepeat: "no-repeat", // Prevents the image from repeating
          backgroundPosition: lng === "ar" ? "right" : "left",
          overflow: "hidden",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            className="reverse-button"
            onClick={() => {
              if (reverseAnimation) {
                reverseAnimation();
              }
            }}
            style={{
              left: 0,
            }}
            sx={{
              display: "none",
              zIndex: 2000,
              backgroundColor: "primary.main",
              color: "white",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
              cursor: "pointer",
              position: "absolute",
            }}
          >
            <IoArrowBackOutline size={26} />
          </Box>
          <Box
            component="img"
            src="/main-logo.jpg"
            alt="Dream Studio - Dream Design & Luxurious Home Solutions"
            className="logo"
            style={{ marginLeft: isMobile ? "-20px" : "-24px" }}
            sx={{
              height: 65,
              width: "auto",
            }}
          />
        </Box>
        <Select
          value={lng}
          onChange={(e) => changeLanguage(e.target.value)}
          variant="outlined"
          size="small"
          sx={{
            color: "primary.main",
            minWidth: 80,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "transparent",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "transparent",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "transparent",
            },
          }}
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="ar">العربية</MenuItem>
        </Select>
      </Toolbar>
    </Container>
  );
}
