import { Box } from "@mui/material";
import { ImageItemViewer } from "@/features/image-session/admin/shared/ImageItemViewer.jsx";
import { CreatePageInfo, CreateSpace } from "@/features/image-session/admin/page-info/CreatePageInfo.jsx";
import PageInfoItem from "@/features/image-session/admin/page-info/PageInfoItem.jsx";

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
