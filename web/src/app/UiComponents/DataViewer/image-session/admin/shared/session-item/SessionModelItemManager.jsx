import { Box } from "@mui/material";
import Templates from "@/app/UiComponents/DataViewer/image-session/admin/shared/Templates.jsx";
import { ImageItemViewer } from "@/app/UiComponents/DataViewer/image-session/admin/shared/ImageItemViewer.jsx";
import { CreateSessionItem } from "@/app/UiComponents/DataViewer/image-session/admin/shared/session-item/CreateSessionItem.jsx";

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
          model: modelType,
        }}
      />
    </Box>
  );
};

export default SessionModelItemManager;
