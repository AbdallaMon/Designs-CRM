import { Box } from "@mui/material";
import Templates from "@/app/UiComponents/DataViewer/image-session/admin/shared/Templates.jsx";
import { ColorItemCard } from "@/app/UiComponents/DataViewer/image-session/admin/color/ColorItem.jsx";
import { ImageItemViewer } from "@/app/UiComponents/DataViewer/image-session/admin/shared/ImageItemViewer.jsx";
import { CreateColor } from "@/app/UiComponents/DataViewer/image-session/admin/color/CreateColor.jsx";

const ColorsMangaer = () => {
  return (
    <Box>
      <Templates type={"COLOR_PATTERN"} />
      <ImageItemViewer
        slug="colors"
        item={ColorItemCard}
        gridSize={{ md: 6 }}
        createComponent={CreateColor}
      />
    </Box>
  );
};

export default ColorsMangaer;
