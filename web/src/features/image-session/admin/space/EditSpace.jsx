import { OpenItemDialog } from "@/features/image-session/admin/shared/OpenItemDialog.jsx";
import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import { EditTitleOrDescFields } from "@/features/image-session/admin/shared/EditTitleOrDesc.jsx";

export function EditSpace({ onUpdate, space }) {
  const { languages } = useLanguage();

  function checkValidation(data) {
    const allFilled = languages.every((lng) =>
      data.titles?.[lng.id]?.text?.trim()
    );
    if (!allFilled) {
      return {
        error: true,
        message: FORM_ERRORS.FILL_ALL_TITLES,
      };
    }

    return { error: false };
  }
  return (
    <OpenItemDialog
      component={EditSpaceForm}
      name={"Space"}
      slug="space"
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
import { FORM_VALIDATION_MESSAGES as FORM_ERRORS } from "@dms/shared";
