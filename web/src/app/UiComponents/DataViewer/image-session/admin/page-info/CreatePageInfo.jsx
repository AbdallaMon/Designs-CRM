import { OpenItemDialog } from "../shared/OpenItemDialog";
import { CreateTitleOrDesc } from "../shared/CreateTitleOrDesc";
import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";

export function CreatePageInfo({ onUpdate }) {
  const { languages } = useLanguage();

  function checkValidation(data) {
    console.log(data, "data");
    const allFilled = languages.every((lng) =>
      data.titles?.[lng.id]?.text?.trim()
    );
    if (!allFilled) {
      return {
        error: true,
        message: "Please fill all titles in all languages",
      };
    }
    if (!data.type) {
      return {
        error: true,
        message: "Please select a type",
      };
    }
    const allFilledDesc = languages.every((lng) =>
      data.descriptions?.[lng.id]?.text?.trim()
    );
    if (!allFilledDesc) {
      return {
        error: true,
        message: "Please fill all descripitons in all languages",
      };
    }
    return { error: false };
  }
  return (
    <OpenItemDialog
      component={CreatePageInfoForm}
      name={"Page info"}
      slug={"image-session/page-info"}
      onUpdate={onUpdate}
      checkValidation={checkValidation}
      type="CREATE"
      buttonType="TEXT"
    />
  );
}
function CreatePageInfoForm({ data, setData, setValid }) {
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
      <Box mb={1} />
      <PageInfoTypeSelector value={data && data.type} setData={setData} />
    </>
  );
}

export const PageInfoTypeSelector = ({ value, setData }) => {
  const types = ["BEFORE_PATTERN", "BEFORE_MATERIAL", "BEFORE_STYLE"];

  const handleChange = (event) => {
    const type = event.target.value;
    setData((prev) => ({ ...prev, type }));
  };

  return (
    <FormControl fullWidth>
      <InputLabel id="page-info-type-label">Page Info Type</InputLabel>
      <Select
        labelId="page-info-type-label"
        value={value || ""}
        label="Page Info Type"
        onChange={handleChange}
      >
        {types.map((type) => (
          <MenuItem key={type} value={type}>
            {type}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
