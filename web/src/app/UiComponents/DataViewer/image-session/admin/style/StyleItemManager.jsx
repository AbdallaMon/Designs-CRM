import SessionModelItemManager from "../shared/session-item/SessionModelItemManager";
import { StyleItemCard } from "./StyleItem";

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
