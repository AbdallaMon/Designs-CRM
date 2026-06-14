import {FormControl, FormHelperText, InputLabel, Select} from "@mui/material";
import {useState} from "react";
import MenuItem from "@mui/material/MenuItem";

export default function SimpleSelect({
                                         select,
                                         variant = "filled",
                                         register,
                                         errors,
                                         set_value
                                     }) {
    const selectData = select.data;
    const options = selectData.options;
    const [value, setValue] = useState(selectData.defaultValue || "");

    // Only benign props may be spread onto <Select>. The raw config carries `options`
    // (an array), `type: "SelectField"`, `label`, `key`, `defaultValue`, `onChange` —
    // none belong on the MUI Select, and a spread `key` is rejected by React 19 (the
    // muiName/removeChild crash). Strip them; keep the rest (e.g. `id`).
    const {
        options: _ignoredOptions,
        type: _ignoredType,
        label: _ignoredLabel,
        key: _ignoredKey,
        defaultValue: _ignoredDefault,
        onChange: _ignoredOnChange,
        sx: _ignoredSx,
        ...selectProps
    } = selectData;

    const handleChange = (event) => {
        setValue(event.target.value);
        select.onChange && select.onChange(event, set_value)
    };

    return (
          <FormControl
                fullWidth={true}
                variant={variant}
                margin="none"
                sx={(theme) => ({
                    minWidth: 120,
                    width: "100%",
                    backgroundColor: variant === "outlined" ? theme.palette.background.default : 'inherit',
                    ...(select.sx && select.sx),
                })}
                error={Boolean(errors[selectData.id])}
          >
              <InputLabel id={selectData.label}>{selectData.label}</InputLabel>
              <Select
                    {...register(selectData.id, select.pattern)}
                    {...selectProps}
                    value={value}
                    onChange={handleChange}
              >
                  {options.map((item) => {
                      return (
                            <MenuItem value={item.value} key={item.value}>
                                {item.label}
                            </MenuItem>
                      );
                  })}
              </Select>
              <FormHelperText>{errors[selectData.id]?.message}</FormHelperText>
          </FormControl>
    );
}
