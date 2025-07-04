import { OpenItemDialog } from "../shared/OpenItemDialog";
import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import { EditTitleAndDescriptionFields } from "../shared/EditTitleAndDescription";

export function EditPageInfo({ onUpdate, pageInfo }) {
  const { languages } = useLanguage();

  function checkValidation(data) {
    const allFilled = languages.every((lng) =>
      data.translations.titles?.[lng.id]?.text?.trim()
    );

    if (!allFilled) {
      return {
        error: true,
        message: "Please fill all titles in all languages",
      };
    }
    const allFilledDesc = languages.every((lng) =>
      data.translations.descriptions?.[lng.id]?.text?.trim()
    );
    if (!allFilledDesc) {
      return {
        error: true,
        message: "Please fill all descripitons in all languages",
      };
    }
    return { error: false };
  }
  return (
    <OpenItemDialog
      component={EditPageInfoForm}
      name={"Page info"}
      slug={"image-session/page-info"}
      onUpdate={onUpdate}
      checkValidation={checkValidation}
      type="EDIT"
      buttonType="ICON"
      initialData={pageInfo}
    />
  );
}
function EditPageInfoForm({ data, setData, setValid, initialData }) {
  return (
    <>
      <EditTitleAndDescriptionFields
        data={data}
        setData={setData}
        initialDescriptions={initialData.content}
        initialTitles={initialData.title}
      />
    </>
  );
}
