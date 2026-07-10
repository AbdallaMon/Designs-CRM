import SessionModelItemManager from "@/features/image-session/admin/shared/session-item/SessionModelItemManager.jsx";
import MaterialItemCard from "@/features/image-session/admin/material/MaterialItem.jsx";

const MaterialManager = ({ type = "MATERIAL", slug = "material" }) => {
  return (
    <SessionModelItemManager
      slug="material"
      itemCard={MaterialItemCard}
      modelType="MATERIAL"
      name="Material"
    />
  );
};

export default MaterialManager;
