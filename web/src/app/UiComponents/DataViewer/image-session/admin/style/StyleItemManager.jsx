import SessionModelItemManager from "@/app/UiComponents/DataViewer/image-session/admin/shared/session-item/SessionModelItemManager.jsx";
import { StyleItemCard } from "@/app/UiComponents/DataViewer/image-session/admin/style/StyleItem.jsx";

const StyleManager = () => {
  return (
    <SessionModelItemManager
      slug="style"
      itemCard={StyleItemCard}
      modelType="STYLE"
      name="Style"
    />
  );
};

export default StyleManager;
