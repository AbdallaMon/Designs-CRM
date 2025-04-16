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
  animateLeadCategoryItem,
  animateLocationItem,
  initialAnimation,
  reverseAnimation,
} from "@/app/UiComponents/client-page/function.js";
import { useLanguageContext } from "@/app/providers/LanguageProvider.jsx";
import { useSearchParams } from "next/navigation";

export default function ClientPage() {
  const [leadCategory, setLeadCategory] = useState();
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
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  useEffect(() => {
    if (typeof window !== "undefined") {
      initialAnimation(
        setIsAnimating,
        type === "interior" ? () => animateLeadCategory("DESIGN") : null
      );
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
      animateLeadCategoryItem({
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
          <LeadCardsContainer handleClick={animateLeadCategory} />
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
          <FinalSelectionForm
            location={location}
            category={leadCategory}
            item={leadItem}
          />
        </Container>
      </Box>
    </>
  );
}
