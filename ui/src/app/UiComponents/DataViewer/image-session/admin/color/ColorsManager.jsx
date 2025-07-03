import { Box } from "@mui/material";
import Templates from "../shared/Templates";
import { ColorItemCard } from "./ColorItem";
import { ImageItemViewer } from "../shared/ImageItemViewer";
import { CreateColor } from "./CreateColor.jsx";

const ColorsMangaer = () => {
  return (
    <Box>
      <Templates type={"COLOR_PATTERN"} />
      <ImageItemViewer
        slug="colors"
        item={ColorItemCard}
        createComponent={CreateColor}
      />
    </Box>
  );
};

export default ColorsMangaer;
