import { Box } from "@mui/material";
import { ImageItemViewer } from "@/features/image-session/admin/shared/ImageItemViewer.jsx";
import SpaceItemCard from "@/features/image-session/admin/space/SpaceItem.jsx";
import { CreateSpace } from "@/features/image-session/admin/space/CreateSpace.jsx";

const SpaceManager = () => {
  return (
    <Box>
      <ImageItemViewer
        slug="space"
        item={SpaceItemCard}
        createComponent={CreateSpace}
      />
    </Box>
  );
};

export default SpaceManager;
