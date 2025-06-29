import { Box } from "@mui/material";
import { ImageItemViewer } from "../shared/ImageItemViewer";
import SpaceItemCard from "./SpaceItem";
import { CreateSpace } from "./CreateSpace";

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
