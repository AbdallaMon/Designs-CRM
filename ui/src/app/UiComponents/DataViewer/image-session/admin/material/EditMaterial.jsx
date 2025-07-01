import { OpenItemDialog } from "../shared/OpenItemDialog";
import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import { TemplateAutocomplete } from "../shared/SelectATemplate";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { Box } from "@mui/material";
import { EditTitleOrDescFields } from "../shared/EditTitleOrDesc";

export function EditMaterial({ onUpdate, material }) {
  const { languages } = useLanguage();
  console.log(material, "material");
  async function checkValidation(data) {
    console.log(data, "data");
    if (!data.templateId) {
      return {
        error: true,
        message: "Please select a template",
      };
    }
    const allFilled = languages.every((lng) =>
      data.titles?.[lng.id]?.text?.trim()
    );

    if (!allFilled) {
      return {
        error: true,
        message: "Please fill all titles in all languages",
      };
    }

    if (data.file) {
      const formData = new FormData();
      formData.append("file", data.file);

      const uploadResponse = await handleRequestSubmit(
        formData,
        setLoading,
        "utility/upload",
        true,
        "Uploading file"
      );
      if (uploadResponse.status !== 200) {
        setAlertError("Error uploading file");
        return;
      }
      data.imageUrl = uploadResponse.fileUrls.file[0];
      delete data.file;
    }

    return { error: false };
  }
  return (
    <OpenItemDialog
      component={EditMaterialForm}
      name={"Material"}
      slug={"image-session/material"}
      onUpdate={onUpdate}
      checkValidation={checkValidation}
      awaitCheck={true}
      type="EDIT"
      buttonType="ICON"
      initialData={material}
    />
  );
}
function EditMaterialForm({ data, setData, setValid, initialData }) {
  return (
    <>
      <EditTitleOrDescFields
        type="TITLE"
        data={data}
        setData={setData}
        setValid={setValid}
        initialData={initialData}
      />
      <EditTitleOrDescFields
        type="DESCRIPTION"
        data={data}
        setData={setData}
        setValid={setValid}
        initialData={initialData}
      />
      <Box my={1}>
        <TemplateAutocomplete
          onTemplateSelect={(id) => {
            setData((old) => ({ ...old, templateId: id }));
          }}
          initialData={initialData}
          type="MATERIAL"
        />
      </Box>
      <SimpleFileInput
        label="Image (optional)"
        id="file"
        variant="outlined"
        helperText="You can leave it empty if u want to render same template image"
        setData={setData}
      />
      {initialData.imageUrl && (
        <Box>
          Uploaded image
          <img src={initialData.imageUrl} width="200" height="200" />
        </Box>
      )}
    </>
  );
}
