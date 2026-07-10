import { Box } from "@mui/material";
import DesignImageItem from "@/features/image-session/admin/image/DesignImageItem.jsx";
import { ImageItemViewer } from "@/features/image-session/admin/shared/ImageItemViewer.jsx";
import { CreateDesginImage } from "@/features/image-session/admin/image/CreateDesginImage.jsx";

const DesignImageManager = () => {
  return (
    <Box>
      <ImageItemViewer
        slug="images"
        item={DesignImageItem}
        createComponent={CreateDesginImage}
        gridSize={{ md: 3 }}
        withPagination={true}
      />
    </Box>
  );
};

export default DesignImageManager;
