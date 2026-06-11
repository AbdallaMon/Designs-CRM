import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { Box } from "@mui/material";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import { OpenItemDialog } from "../OpenItemDialog";
import { CreateTitleOrDesc } from "../CreateTitleOrDesc";
import { TemplateAutocomplete } from "../SelectATemplate";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";

export function CreateSessionItem({
  onUpdate,
  name = "Material",
  slug = "material",
  modelType = "MATERIAL",
}) {
  const { languages } = useLanguage();
  const { setLoading } = useToastContext();
  const { setProgress, setOverlay } = useUploadContext();
  async function checkValidation(data) {
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
      const fileUpload = await uploadInChunks(
        data.file,
        setProgress,
        setOverlay
      );
      if (fileUpload.status === 200) {
        data.imageUrl = fileUpload.url;
      }
      delete data.file;
    }

    return { error: false };
  }
  return (
    <OpenItemDialog
      component={CreateSessionItemForm}
      name={name}
      modelType={modelType}
      slug={`image-session/${slug}`}
      onUpdate={onUpdate}
      checkValidation={checkValidation}
      awaitCheck={true}
      type="CREATE"
      buttonType="TEXT"
    />
  );
}
function CreateSessionItemForm({ data, setData, setValid, modelType }) {
  return (
    <>
      <CreateTitleOrDesc
        type="TITLE"
        data={data}
        setData={setData}
        setValid={setValid}
      />
      <CreateTitleOrDesc
        type="DESCRIPTION"
        data={data}
        setData={setData}
        setValid={setValid}
      />
      <Box my={1}>
        <TemplateAutocomplete
          onTemplateSelect={(id) => {
            setData((old) => ({ ...old, templateId: id }));
          }}
          type={modelType}
        />
      </Box>
      <SimpleFileInput
        label="Image (optional)"
        id="file"
        variant="outlined"
        helperText="You can leave it empty if u want to render same template image"
        setData={setData}
      />
    </>
  );
}
