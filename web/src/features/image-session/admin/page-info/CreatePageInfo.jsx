import { OpenItemDialog } from "@/features/image-session/admin/shared/OpenItemDialog.jsx";
import { CreateTitleOrDesc } from "@/features/image-session/admin/shared/CreateTitleOrDesc.jsx";
import { useLanguage } from "@/app/helpers/hooks/useLanguage";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { PAGE_INFO_TYPES, FORM_VALIDATION_MESSAGES as FORM_ERRORS } from "@dms/shared";

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
        message: FORM_ERRORS.FILL_ALL_TITLES,
      };
    }
    if (!data.type) {
      return {
        error: true,
        message: FORM_ERRORS.SELECT_TYPE,
      };
    }
    const allFilledDesc = languages.every((lng) =>
      data.descriptions?.[lng.id]?.text?.trim()
    );
    if (!allFilledDesc) {
      return {
        error: true,
        message: FORM_ERRORS.FILL_ALL_DESCRIPTIONS,
      };
    }
    return { error: false };
  }
  return (
    <OpenItemDialog
      component={CreatePageInfoForm}
      name={"Page info"}
      slug="page-info"
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
  const types = [PAGE_INFO_TYPES.BEFORE_PATTERN, PAGE_INFO_TYPES.BEFORE_MATERIAL, PAGE_INFO_TYPES.BEFORE_STYLE];

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
