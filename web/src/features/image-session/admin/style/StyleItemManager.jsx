import SessionModelItemManager from "@/features/image-session/admin/shared/session-item/SessionModelItemManager.jsx";
import { StyleItemCard } from "@/features/image-session/admin/style/StyleItem.jsx";

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
