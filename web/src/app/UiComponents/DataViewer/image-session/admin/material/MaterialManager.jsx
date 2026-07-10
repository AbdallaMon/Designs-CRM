import SessionModelItemManager from "@/app/UiComponents/DataViewer/image-session/admin/shared/session-item/SessionModelItemManager.jsx";
import MaterialItemCard from "@/app/UiComponents/DataViewer/image-session/admin/material/MaterialItem.jsx";

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
