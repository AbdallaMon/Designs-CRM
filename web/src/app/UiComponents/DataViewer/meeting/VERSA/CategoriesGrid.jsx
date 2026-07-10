"use client";

import React from "react";
import { Grid, Container } from "@mui/material";

import { CategoryCard } from "@/app/UiComponents/DataViewer/meeting/VERSA/CategoryCard.jsx";

export const CategoriesGrid = ({ categories, onCategoryClick }) => {
  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Grid container spacing={4}>
        {categories.map((category, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={category.id}>
            <CategoryCard
              category={category}
              onClick={onCategoryClick}
              index={index}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};
