import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { Box, Typography } from "@mui/material";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import IsFullWidthSwitch, {
  ColorSelector,
  CreateColorPattern,
  OrderInput,
} from "./PalleteItems";
import { OpenItemDialog } from "../shared/OpenItemDialog";
import { CreateTitleOrDesc } from "../shared/CreateTitleOrDesc";
import { TemplateAutocomplete } from "../shared/SelectATemplate";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";

export function CreateColor({ onUpdate }) {
  const { languages } = useLanguage();
  const { setLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
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
      component={CreateColorForm}
      name={"Colors"}
      modelType={"COLOR_PATTERN"}
      slug={`image-session/colors`}
      onUpdate={onUpdate}
      checkValidation={checkValidation}
      awaitCheck={true}
      type="CREATE"
      buttonType="TEXT"
    />
  );
}
function CreateColorForm({ data, setData, setValid }) {
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
      <Box my={1} mb={2}>
        <TemplateAutocomplete
          onTemplateSelect={(id) => {
            setData((old) => ({ ...old, templateId: id }));
          }}
          isFullWidth={true}
          type={"COLOR_PATTERN"}
        />
      </Box>
      <Box my={1} mb={2} sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <IsFullWidthSwitch data={data} setData={setData} />
        <OrderInput data={data} setData={setData} />
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
          color={data?.background || "#000000"}
          isEditable={false}
          onChange={(newColor) =>
            setData((old) => ({ ...old, background: newColor }))
          }
          onEditableToggle={() => toggleEditable(index)}
          canDelete={false}
          canBeEditable={false}
        />{" "}
      </Box>

      <Box my={2}>
        <CreateColorPattern data={data} setData={setData} />
      </Box>
    </>
  );
}
