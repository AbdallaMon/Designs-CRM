import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { Box } from "@mui/material";
import { ensureHttps } from "@/app/helpers/functions/utility";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { OpenItemDialog } from "../shared/OpenItemDialog";
import { AutoCompleteSelector } from "../shared/session-item/AutoCompleteSelector";
import { MultiAutoCompleteSelector } from "../shared/session-item/MultiAutoCompleteSelector";
import ImageLoader from "../shared/ImageLoader ";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";

export function EditDesignImage({ onUpdate, initialData }) {
  const { setLoading } = useToastContext();
  const { setProgress, setOverlay } = useUploadContext();

  async function checkValidation(data) {
    if (!data) {
      return {
        error: true,
        message: "No thing to update",
      };
    }
    if (data.spaceIds && data.spaceIds.length === 0) {
      return {
        error: true,
        message: "Select at least one sapce",
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
      component={EditDesignImageForm}
      name={"Images"}
      modelType={"DesignImage"}
      slug={`image-session/images`}
      onUpdate={onUpdate}
      checkValidation={checkValidation}
      awaitCheck={true}
      type="EDIT"
      buttonType="ICON"
      initialData={initialData}
    />
  );
}
function EditDesignImageForm({ data, setData, initialData }) {
  return (
    <>
      <Box my={1} display="flex" flexDirection="column" gap={1}>
        {initialData.imageUrl && (
          <Box sx={{ width: "300px", mb: 1.5 }}>
            Selected image
            <ImageLoader
              src={initialData.imageUrl}
              alt={"Design Image dream studio"}
              skeletonHeight={200}
              borderRadius={2}
            />
          </Box>
        )}
        <SimpleFileInput
          label="Image"
          id="file"
          variant="outlined"
          setData={setData}
        />
        <AutoCompleteSelector
          onSelect={(id) => {
            console.log("On change");
            setData((old) => ({ ...old, styleId: id }));
          }}
          keyId="styleId"
          model="Style"
          select={"id,title"}
          isLanguage={true}
          initialData={initialData}
          where={{
            isArchived: false,
          }}
        />
        <MultiAutoCompleteSelector
          setData={setData}
          updateKey="spaceIds"
          model="Space"
          label="Select Spaces"
          select={"id,title"}
          isLanguage={true}
          initialSelectedIds={initialData.spaces.map((space) => space.space.id)}
          where={{
            isArchived: false,
          }}
        />
      </Box>
    </>
  );
}
