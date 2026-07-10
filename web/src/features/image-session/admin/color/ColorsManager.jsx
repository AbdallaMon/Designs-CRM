import { Box } from "@mui/material";
import Templates from "@/features/image-session/admin/shared/Templates.jsx";
import { ColorItemCard } from "@/features/image-session/admin/color/ColorItem.jsx";
import { ImageItemViewer } from "@/features/image-session/admin/shared/ImageItemViewer.jsx";
import { CreateColor } from "@/features/image-session/admin/color/CreateColor.jsx";

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
