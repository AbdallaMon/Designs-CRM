import {Controller} from "react-hook-form";
import {FormControlLabel, Switch} from "@mui/material";

export default function MuiSwitch({control, input}) {
    const inputData = input.data;
    const {label, id} = inputData;
    return (
          <Controller
                name={id}
                control={control}
                render={({field: {value = inputData.defaultValue, onChange}}) => (
                      <FormControlLabel
                            control={
                                <Switch
                                      checked={value}
                                      id={id}
                                      onChange={(e) => onChange(e.target.checked)}
                                />
                            }
                            label={label}
                      />
                )}
          />
    );
}
