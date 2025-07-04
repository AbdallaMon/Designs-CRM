import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { Box } from "@mui/material";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { OpenItemDialog } from "../shared/OpenItemDialog";
import { AutoCompleteSelector } from "../shared/session-item/AutoCompleteSelector";
import { MultiAutoCompleteSelector } from "../shared/session-item/MultiAutoCompleteSelector";

export function CreateDesginImage({ onUpdate }) {
  const { setLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
  async function checkValidation(data) {
    console.log(data, "Check");

    if (!data || !data.styleId) {
      return {
        error: true,
        message: "Please select a style",
      };
    }
    if (!data.spaceIds || data.spaceIds.length === 0) {
      return {
        error: true,
        message: "Please select at least one space",
      };
    }
    if (!data.file) {
      return {
        error: true,
        message: "Please upload an image file",
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
      component={CreateDesignImage}
      name={"Images"}
      modelType={"DesignImage"}
      slug={`image-session/images`}
      onUpdate={onUpdate}
      checkValidation={checkValidation}
      awaitCheck={true}
      type="CREATE"
      buttonType="TEXT"
    />
  );
}
function CreateDesignImage({ data, setData, setValid }) {
  return (
    <>
      <Box my={1} display="flex" flexDirection="column" gap={1}>
        <SimpleFileInput
          label="Image"
          id="file"
          variant="outlined"
          setData={setData}
        />
        <AutoCompleteSelector
          onSelect={(id) => {
            setData((old) => ({ ...old, styleId: id }));
          }}
          keyId="styleId"
          model="Style"
          select={"id"}
          where={{
            isArchived: false,
          }}
        />
        <MultiAutoCompleteSelector
          setData={setData}
          updateKey="spaceIds"
          model="Space"
          label="Select Spaces"
          where={{
            isArchived: false,
          }}
        />
      </Box>
    </>
  );
}
