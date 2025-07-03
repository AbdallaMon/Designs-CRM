import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { Box } from "@mui/material";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import { CreateColorPattern } from "./PalleteItems";
import { OpenItemDialog } from "../shared/OpenItemDialog";
import { CreateTitleOrDesc } from "../shared/CreateTitleOrDesc";
import { TemplateAutocomplete } from "../shared/SelectATemplate";

export function CreateColor({ onUpdate }) {
  const { languages } = useLanguage();
  const { setLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
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
      <Box my={1}>
        <TemplateAutocomplete
          onTemplateSelect={(id) => {
            setData((old) => ({ ...old, templateId: id }));
          }}
          type={"COLOR_PATTERN"}
        />
      </Box>
      <SimpleFileInput
        label="Image (optional)"
        id="file"
        variant="outlined"
        helperText="You can leave it empty if u want to render same template image"
        setData={setData}
      />
      <Box my={2}>
        <CreateColorPattern data={data} setData={setData} />
      </Box>
    </>
  );
}
