import SessionModelItemManager from "../shared/session-item/SessionModelItemManager";
import MaterialItemCard from "./MaterialItem";

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
