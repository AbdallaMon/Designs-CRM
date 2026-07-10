"use client";

import React from "react";
import { Grid } from "@mui/material";

import { CategoryCard } from "@/features/meeting/VERSA/CategoryCard.jsx";

export const CategoriesGrid = ({ categories, onCategoryClick }) => {
  return (
    <Grid container spacing={2}>
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
  );
};
