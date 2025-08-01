import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import { TemplateAutocomplete } from "../SelectATemplate";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { Box } from "@mui/material";
import { EditTitleAndDescriptionFields } from "../EditTitleAndDescription";
import { ensureHttps } from "@/app/helpers/functions/utility";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { OpenItemDialog } from "../OpenItemDialog";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";

export function EditSessionItem({
  onUpdate,
  initialData,
  name = "Material",
  slug = "material",
  modelType = "MATERIAL",
}) {
  const { languages } = useLanguage();
  const { setLoading } = useToastContext();
  const { setProgress, setOverlay } = useUploadContext();

  async function checkValidation(data) {
    const allFilled = languages.every((lng) =>
      data.translations.titles?.[lng.id]?.text?.trim()
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
      delete data.file;
    }

    return { error: false };
  }
  return (
    <OpenItemDialog
      component={EditMaterialForm}
      name={name}
      modelType={modelType}
      slug={`image-session/${slug}`}
      onUpdate={onUpdate}
      checkValidation={checkValidation}
      awaitCheck={true}
      type="EDIT"
      buttonType="ICON"
      initialData={initialData}
    />
  );
}
function EditMaterialForm({ data, setData, initialData, modelType }) {
  return (
    <>
      <EditTitleAndDescriptionFields
        data={data}
        setData={setData}
        initialDescriptions={initialData.description}
        initialTitles={initialData.title}
      />

      <Box my={1}>
        <TemplateAutocomplete
          onTemplateSelect={(id) => {
            setData((old) => ({ ...old, templateId: id }));
          }}
          initialData={initialData}
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
      {initialData.imageUrl && (
        <Box>
          Uploaded image
          <img
            src={ensureHttps(initialData.imageUrl)}
            width="200"
            height="200"
          />
        </Box>
      )}
    </>
  );
}
