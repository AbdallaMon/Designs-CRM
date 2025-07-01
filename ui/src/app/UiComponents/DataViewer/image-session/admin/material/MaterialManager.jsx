import { Box } from "@mui/material";
import Templates from "../shared/Templates";
import { ImageItemViewer } from "../shared/ImageItemViewer";
import { MaterialItemCard } from "./MaterialItem";
import { CreateMaterial } from "./CreateMaterial";

const MaterialManager = ({ type = "MATERIAL", slug = "material" }) => {
  return (
    <Box>
      <Templates type={type} />
      <ImageItemViewer
        slug="material"
        item={MaterialItemCard}
        createComponent={CreateMaterial}
        gridSize={{ md: 6 }}
        extra={{
          model: "MATERIAL",
        }}
      />
    </Box>
  );
};

export default MaterialManager;
