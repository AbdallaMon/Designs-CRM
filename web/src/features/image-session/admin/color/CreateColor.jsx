import { useEffect } from "react";
import SimpleFileInput from "@/shared/components/formComponents/SimpleFileInput";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { Box, Typography } from "@mui/material";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import IsFullWidthSwitch, {
  ColorSelector,
  CreateColorPattern,
  OrderInput,
} from "@/features/image-session/admin/color/PalleteItems.jsx";
import { OpenItemDialog } from "@/features/image-session/admin/shared/OpenItemDialog.jsx";
import { CreateTitleOrDesc } from "@/features/image-session/admin/shared/CreateTitleOrDesc.jsx";
import { TemplateAutocomplete } from "@/features/image-session/admin/shared/SelectATemplate.jsx";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { FORM_VALIDATION_MESSAGES as FORM_ERRORS } from "@dms/shared";

export function CreateColor({ onUpdate }) {
  const { languages } = useLanguage();
  const { setLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
  const { setProgress, setOverlay } = useUploadContext();

  async function checkValidation(data) {
    if (!data.templateId) {
      return {
        error: true,
        message: FORM_ERRORS.SELECT_TEMPLATE,
      };
    }
    const allFilled = languages.every((lng) =>
      data.titles?.[lng.id]?.text?.trim()
    );

    if (!allFilled) {
      return {
        error: true,
        message: FORM_ERRORS.FILL_ALL_TITLES,
      };
    }

    if (data.file) {
      const uploadResponse = await uploadInChunks(
        data.file,
        setProgress,
        setOverlay
      );
      if (uploadResponse.status === 200) {
        data.imageUrl = uploadResponse.url;
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
      slug="colors"
      onUpdate={onUpdate}
      checkValidation={checkValidation}
      awaitCheck={true}
      type="CREATE"
      buttonType="TEXT"
    />
  );
}
function CreateColorForm({ data, setData, setValid }) {
  // Seed the default background into the form data on mount. The ColorSelector below only
  // fires onChange when the value CHANGES, so an untouched default (#000000) was never
  // written to `data.background` and the backend rejected it ("Please select a background").
  useEffect(() => {
    setData((old) =>
      old?.background ? old : { ...(old || {}), background: "#000000" }
    );
  }, []);
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
