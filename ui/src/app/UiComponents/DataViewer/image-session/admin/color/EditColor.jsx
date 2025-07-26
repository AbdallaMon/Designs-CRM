import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { Box, Typography } from "@mui/material";
import { ensureHttps } from "@/app/helpers/functions/utility";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { OpenItemDialog } from "../shared/OpenItemDialog";
import { EditTitleAndDescriptionFields } from "../shared/EditTitleAndDescription";
import { TemplateAutocomplete } from "../shared/SelectATemplate";
import IsFullWidthSwitch, {
  ColorSelector,
  EditColorPattern,
  OrderInput,
} from "./PalleteItems";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";

export function EditColor({ onUpdate, initialData }) {
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
      const uploadResponse = await uploadInChunks(
        data.file,
        setProgress,
        setOverlay
      );
      if (uploadResponse.status === 200) {
        data.imageUrl = fileUpload.url;
      }

      delete data.file;
    }

    return { error: false };
  }
  return (
    <OpenItemDialog
      component={EditColorForm}
      name={"Color"}
      modelType={"COLOR_PATTERN"}
      slug={`image-session/colors`}
      onUpdate={onUpdate}
      checkValidation={checkValidation}
      awaitCheck={true}
      type="EDIT"
      buttonType="ICON"
      initialData={initialData}
    />
  );
}
function EditColorForm({ data, setData, initialData }) {
  return (
    <>
      <EditTitleAndDescriptionFields
        data={data}
        setData={setData}
        initialDescriptions={initialData.description}
        initialTitles={initialData.title}
      />

      <Box my={1} mb={2}>
        <TemplateAutocomplete
          onTemplateSelect={(id) => {
            setData((old) => ({ ...old, templateId: id }));
          }}
          isFullWidth={true}
          initialData={initialData}
          type={"COLOR_PATTERN"}
        />
      </Box>
      <Box my={1} mb={2} sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <IsFullWidthSwitch
          initialData={initialData}
          data={data}
          setData={setData}
        />
        <OrderInput data={data} initialData={initialData} setData={setData} />
      </Box>
      <SimpleFileInput
        label="Image (optional)"
        id="file"
        variant="outlined"
        helperText="You can leave it empty if u want to render same template image"
        setData={setData}
      />
      <Box my={2}>
        <Typography variant="h5">Main background</Typography>
        <ColorSelector
          color={data?.background || initialData?.background || "#000000"}
          isEditable={false}
          onChange={(newColor) =>
            setData((old) => ({ ...old, background: newColor }))
          }
          onEditableToggle={() => toggleEditable(index)}
          canDelete={false}
          canBeEditable={false}
        />
      </Box>
      <Box my={2}>
        <EditColorPattern
          data={data}
          setData={setData}
          initialColors={initialData.colors}
        />
      </Box>
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
