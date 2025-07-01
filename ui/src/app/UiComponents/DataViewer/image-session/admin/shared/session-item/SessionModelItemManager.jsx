import { Box } from "@mui/material";
import Templates from "../Templates";
import { ImageItemViewer } from "../ImageItemViewer";
import { CreateSessionItem } from "./CreateSessionItem";

const SessionModelItemManager = ({
  name = "Material",
  slug = "material",
  modelType = "MATERIAL",
  itemCard,
}) => {
  const ItemCard = itemCard;
  return (
    <Box>
      <Templates type={modelType} />
      <ImageItemViewer
        slug={slug}
        modelType={modelType}
        name={name}
        item={ItemCard}
        createComponent={CreateSessionItem}
        gridSize={{ md: 6 }}
        extra={{
          model: "MATERIAL",
        }}
      />
    </Box>
  );
};

export default SessionModelItemManager;
