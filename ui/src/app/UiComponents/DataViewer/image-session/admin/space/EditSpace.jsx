import { OpenItemDialog } from "../shared/OpenItemDialog";
import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import { EditTitleOrDescFields } from "../shared/EditTitleOrDesc";

export function EditSpace({ onUpdate, space }) {
  const { languages } = useLanguage();

  function checkValidation(data) {
    const allFilled = languages.every((lng) =>
      data.titles?.[lng.id]?.text?.trim()
    );
    if (!allFilled) {
      return {
        error: true,
        message: "Please fill all titles in all languages",
      };
    }

    return { error: false };
  }
  return (
    <OpenItemDialog
      component={EditSpaceForm}
      name={"Space"}
      slug={"image-session/space"}
      onUpdate={onUpdate}
      checkValidation={checkValidation}
      type="EDIT"
      buttonType="ICON"
      initialData={space}
    />
  );
}
function EditSpaceForm({ data, setData, setValid, initialData }) {
  return (
    <>
      <EditTitleOrDescFields
        type="TITLE"
        data={data}
        setData={setData}
        setValid={setValid}
        initialData={initialData.title}
      />
    </>
  );
}
