"use client";
import React, { useEffect, useState } from "react";
import { Box, Container, Paper } from "@mui/material";
import colors from "@/app/helpers/colors.js";
import { FinalSelectionForm } from "@/app/UiComponents/client-page/FinalSelectionForm.jsx";
import {
  DesignLeadsContainer,
  Header,
  LeadCardsContainer,
  LeadCategoryItemsContainer,
} from "@/app/UiComponents/client-page/LeacComponents.jsx";
import {
  animateFormPage,
  animateLocationItem,
  reverseAnimation,
} from "@/app/UiComponents/client-page/function.js";
import { useLanguageContext } from "@/app/providers/LanguageProvider.jsx";
import { animateRegisterLeadCategoryItem } from "../registerFunctions";
import { CompleteRegisterForm } from "./CompleteRegisterForm";

export default function CompleteRegister({ leadId }) {
  const [leadCategory, setLeadCategory] = useState("DESIGN");
  const [animateLeadType, setAnimateLeadType] = useState("");
  const [isCatAnimated, setIsCatAnimated] = useState(false);
  const [leadItem, setLeadItem] = useState("");
  const [animateLeadItem, setAnimateLeadItem] = useState("");
  const [isItemAnimated, setIsItemAnimated] = useState(false);
  const [isReversing, setIsReversing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [location, setLocation] = useState("");
  const [animateLocation, setAnimateLocation] = useState("");
  const [isLocationAnimated, setIsLocationAnimated] = useState(false);
  const { translate } = useLanguageContext();
  useEffect(() => {
    if (typeof window !== "undefined") {
      animateLeadCategory("DESIGN", true);
    }
  }, []);

  function animateLeadCategory(value) {
    if (value !== "DESIGN") {
      return;
    }
    if (isCatAnimated || isAnimating || isReversing) return;
    setLeadCategory(value);
    setAnimateLeadType("animate");
    window.sessionStorage.setItem("animated", "done");
  }
  function animateLeadItemAfterLocationClick(value) {
    if (isLocationAnimated || isAnimating || isReversing) return;
    setLocation(value);
    setAnimateLocation("animate");
  }
  function animateLeadCategoryItems(value) {
    if (isItemAnimated || isAnimating || isReversing) return;
    setLeadItem(value);
    setAnimateLeadItem("animate");
  }
  useEffect(() => {
    if (
      animateLeadType === "animate" &&
      !isCatAnimated &&
      !isAnimating &&
      !isReversing
    ) {
      animateRegisterLeadCategoryItem({
        leadCategory,
        setIsAnimating,
        setIsCatAnimated,
      });
    }
  }, [animateLeadType]);

  useEffect(() => {
    if (
      animateLeadItem === "animate" &&
      !isItemAnimated &&
      !isAnimating &&
      !isReversing
    ) {
      animateFormPage({ setIsAnimating, setIsItemAnimated });
    }
  }, [animateLeadItem]);
  useEffect(() => {
    if (
      animateLocation === "animate" &&
      !isLocationAnimated &&
      !isAnimating &&
      !isReversing
    ) {
      animateLocationItem({
        leadCategory,
        location,
        setIsAnimating,
        setIsLocationAnimated,
        translate,
      });
    }
  }, [animateLocation]);
  return (
    <>
      {!isCatAnimated && (
        <Box
          sx={{
            position: "fixed",
            zIndex: 4000,
            width: "100vw",
            height: "100%",
            top: 0,
            left: 0,
            backgroundImage: "url(/design.jfif)",
            backgroundPosition: "center",
            backgroundSize: "cover",
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
          ></Box>
        </Box>
      )}
      {/* )} */}
      <Header
        reverseAnimation={() =>
          reverseAnimation({
            location,
            leadCategory,
            leadItem,
            setIsItemAnimated,
            setIsCatAnimated,
            isAnimating,
            isCatAnimated,
            isItemAnimated,
            isReversing,
            setAnimateLeadItem,
            setAnimateLeadType,
            setIsReversing,
            setLeadCategory,
            setLeadItem,
            setAnimateLocation,
            setIsLocationAnimated,
            setLocation,
            isLocationAnimated,
          })
        }
      />
      <Container
        maxWidth="md"
        sx={{
          height: !leadCategory
            ? "auto"
            : (leadCategory !== "DESIGN" && !leadItem) || leadItem
            ? "100vh"
            : "auto",
          overflow: { md: "hidden" },
          py: { xs: 3, md: 4 },
          pb: { xs: 16, md: 10 },
        }}
      >
        <Paper
          className="page-container"
          elevation={2}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: "12px",
            backgroundColor: colors.bgPrimary,
            width: "100%",
            minHeight: "calc(100vh - 48px)",
          }}
        >
          <LeadCardsContainer
            handleClick={animateLeadCategory}
            isCatAnimated={isCatAnimated}
          />
          {leadCategory && (
            <>
              {leadCategory === "DESIGN" && (
                <DesignLeadsContainer
                  handleClick={animateLeadItemAfterLocationClick}
                />
              )}
              <LeadCategoryItemsContainer
                leadCategory={leadCategory}
                animateLeadCategoryItems={animateLeadCategoryItems}
                location={location}
              />
            </>
          )}
        </Paper>
      </Container>
      <Box
        className="form-page"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100vh",
          background: colors.bgPrimary,
          zIndex: leadCategory === "CONSULTATION" ? 200000000000 : 20,
          display: "none",
          overflowY: "auto",
        }}
      >
        <Container
          maxWidth="md"
          sx={{
            overflow: "hidden",
            pb: { xs: 16, md: 10 },
            pt: 10,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CompleteRegisterForm
            location={location}
            category={leadCategory}
            item={leadItem}
            leadId={leadId}
          />
        </Container>
      </Box>
    </>
  );
}
