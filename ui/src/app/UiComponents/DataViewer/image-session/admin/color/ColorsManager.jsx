import { Box } from "@mui/material";
import Templates from "../shared/Templates";
import { CreateColor } from "./CreateColor";
import { ColorItemCard } from "./ColorItem";
import { ImageItemViewer } from "../shared/ImageItemViewer";

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
