import { OpenItemDialog } from "@/features/image-session/admin/shared/OpenItemDialog.jsx";
import { CreateTitleOrDesc } from "@/features/image-session/admin/shared/CreateTitleOrDesc.jsx";
import { useLanguage } from "@/app/helpers/hooks/useLanguage";

export function CreateSpace({ onUpdate }) {
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
      component={CreateSpaceForm}
      name={"Space"}
      slug="space"
      onUpdate={onUpdate}
      checkValidation={checkValidation}
      type="CREATE"
      buttonType="TEXT"
    />
  );
}
function CreateSpaceForm({ data, setData, setValid }) {
  return (
    <>
      <CreateTitleOrDesc
        type="TITLE"
        data={data}
        setData={setData}
        setValid={setValid}
      />
    </>
  );
}
import { FORM_VALIDATION_MESSAGES as FORM_ERRORS } from "@dms/shared";
