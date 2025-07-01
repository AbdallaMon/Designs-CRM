import { OpenItemDialog } from "../shared/OpenItemDialog";
import { CreateTitleOrDesc } from "../shared/CreateTitleOrDesc";
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
        message: "Please fill all titles in all languages",
      };
    }

    return { error: false };
  }
  return (
    <OpenItemDialog
      component={CreateSpaceForm}
      name={"Space"}
      slug={"image-session/space"}
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
