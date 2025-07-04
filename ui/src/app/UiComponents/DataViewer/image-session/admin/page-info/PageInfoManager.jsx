import { Box } from "@mui/material";
import { ImageItemViewer } from "../shared/ImageItemViewer";
import { CreatePageInfo, CreateSpace } from "./CreatePageInfo";
import PageInfoItem from "./PageInfoItem";

const PageInfoManager = () => {
  return (
    <Box>
      <ImageItemViewer
        slug="page-info"
        item={PageInfoItem}
        createComponent={CreatePageInfo}
        gridSize={{ md: 6 }}
      />
    </Box>
  );
};

export default PageInfoManager;
