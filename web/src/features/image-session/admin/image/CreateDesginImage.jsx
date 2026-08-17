import SimpleFileInput from "@/shared/components/formComponents/SimpleFileInput";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { Box } from "@mui/material";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { OpenItemDialog } from "@/features/image-session/admin/shared/OpenItemDialog.jsx";
import { AutoCompleteSelector } from "@/features/image-session/admin/shared/session-item/AutoCompleteSelector.jsx";
import { MultiAutoCompleteSelector } from "@/features/image-session/admin/shared/session-item/MultiAutoCompleteSelector.jsx";
import MultiFileInput from "@/shared/components/formComponents/MulitFileInput";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { FORM_VALIDATION_MESSAGES as FORM_ERRORS } from "@dms/shared";

export function CreateDesginImage({ onUpdate }) {
  const { setLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
  const { setProgress, setOverlay } = useUploadContext();

  async function checkValidation(data) {
    if (!data || !data.styleId) {
      return {
        error: true,
        message: FORM_ERRORS.SELECT_STYLE,
      };
    }
    if (!data.spaceIds || data.spaceIds.length === 0) {
      return {
        error: true,
        message: FORM_ERRORS.SELECT_SPACE,
      };
    }
    if (!data.file) {
      return {
        error: true,
        message: FORM_ERRORS.UPLOAD_IMAGE,
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
  async function checkBulkValidation(data) {
    if (!data || !data.styleId) {
      return {
        error: true,
        message: FORM_ERRORS.SELECT_STYLE,
      };
    }
    if (!data.spaceIds || data.spaceIds.length === 0) {
      return {
        error: true,
        message: FORM_ERRORS.SELECT_SPACE,
      };
    }
    if (!data.file) {
      return {
        error: true,
        message: FORM_ERRORS.UPLOAD_IMAGE,
      };
    }
    if (data.file) {
      data.imagesUrls = [];
      const formData = new FormData();
      for (const file of data.file) {
        formData.append("file", file);
        const fileUpload = await uploadInChunks(file, setProgress, setOverlay);
        if (fileUpload.status === 200) {
          data.imagesUrls.push(fileUpload.url);
        }
      }

      delete data.file;
    }
    console.log(data, "data");
    return { error: false };
  }
  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <OpenItemDialog
        component={CreateDesignImage}
        name={"Images"}
        modelType={"DesignImage"}
        slug="images"
        onUpdate={onUpdate}
        checkValidation={checkValidation}
        awaitCheck={true}
        type="CREATE"
        buttonType="TEXT"
      />
      <OpenItemDialog
        component={CreateBulkDesignImage}
        name={"Multi Images"}
        modelType={"DesignImage"}
        slug="images/bulk"
        onUpdate={onUpdate}
        checkValidation={checkBulkValidation}
        awaitCheck={true}
        type="CREATE"
        buttonType="TEXT"
      />
    </Box>
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
          where={{
            isArchived: false,
          }}
          select={"id,title"}
          isLanguage={true}
        />
        <MultiAutoCompleteSelector
          setData={setData}
          updateKey="spaceIds"
          select={"id,title"}
          isLanguage={true}
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

function CreateBulkDesignImage({ data, setData, setValid }) {
  return (
    <>
      <Box my={1} display="flex" flexDirection="column" gap={1}>
        <MultiFileInput
          label="Images"
          id="file"
          variant="outlined"
          input={{ accept: "image/*" }}
          setData={setData}
          value={data}
        />
        <AutoCompleteSelector
          onSelect={(id) => {
            setData((old) => ({ ...old, styleId: id }));
          }}
          keyId="styleId"
          model="Style"
          where={{
            isArchived: false,
          }}
          select={"id,title"}
          isLanguage={true}
        />
        <MultiAutoCompleteSelector
          setData={setData}
          updateKey="spaceIds"
          select={"id,title"}
          isLanguage={true}
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
