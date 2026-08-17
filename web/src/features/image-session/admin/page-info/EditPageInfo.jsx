import { OpenItemDialog } from "@/features/image-session/admin/shared/OpenItemDialog.jsx";
import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import { EditTitleAndDescriptionFields } from "@/features/image-session/admin/shared/EditTitleAndDescription.jsx";
import { FORM_VALIDATION_MESSAGES as FORM_ERRORS } from "@dms/shared";

export function EditPageInfo({ onUpdate, pageInfo }) {
  const { languages } = useLanguage();

  function checkValidation(data) {
    const allFilled = languages.every((lng) =>
      data.translations.titles?.[lng.id]?.text?.trim()
    );

    if (!allFilled) {
      return {
        error: true,
        message: FORM_ERRORS.FILL_ALL_TITLES,
      };
    }
    const allFilledDesc = languages.every((lng) =>
      data.translations.descriptions?.[lng.id]?.text?.trim()
    );
    if (!allFilledDesc) {
      return {
        error: true,
        message: FORM_ERRORS.FILL_ALL_DESCRIPTIONS,
      };
    }
    return { error: false };
  }
  return (
    <OpenItemDialog
      component={EditPageInfoForm}
      name={"Page info"}
      slug="page-info"
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
