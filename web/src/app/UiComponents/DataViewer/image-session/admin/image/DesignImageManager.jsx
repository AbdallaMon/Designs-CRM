import { Box } from "@mui/material";
import DesignImageItem from "./DesignImageItem";
import { ImageItemViewer } from "../shared/ImageItemViewer";
import { CreateDesginImage } from "./CreateDesginImage";

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
