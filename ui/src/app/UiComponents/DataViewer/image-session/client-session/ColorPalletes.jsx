"use client";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { useEffect, useState } from "react";
import { PreviewItem } from "./PreviewItem";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import { Grid2 as Grid } from "@mui/material";
export function ColorPalletes() {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(false);
  const { lng } = useLanguageSwitcherContext();

  async function getColorsPalletes() {
    await getDataAndSet({
      url: `client/image-session/colors?lng=${lng}&`,
      setLoading,
      setData: setColors,
    });
  }
  useEffect(() => {
    getColorsPalletes();
  }, []);

  return (
    <>
      {loading && <FullScreenLoader />}
      <Grid container>
        {colors.map((color) => {
          return (
            <Grid size={color.isFullWidth ? 12 : 6} key={color.id}>
              <PreviewItem item={color} template={color.template} />
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}
