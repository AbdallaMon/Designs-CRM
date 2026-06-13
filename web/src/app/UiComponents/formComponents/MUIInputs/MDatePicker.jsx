import {FormControl} from "@mui/material";
import {Controller} from "react-hook-form";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import "dayjs/locale/en-gb";

export function MDatePicker({control, input, errors, setValue, variant}) {
    const inputData = input.data;
    dayjs.locale("en-gb");
    return (
          <FormControl
                fullWidth
                error={!!errors[inputData.id]}
                sx={(theme) => ({
                    backgroundColor: variant === "outlined" ? theme.palette.background.default : 'inherit',
                    ...(input.sx && input.sx),
                })}
                className={"MUI" + inputData.id}
                margin={"none"}
          >
              <Controller
                    name={inputData.id}
                    control={control}
                    defaultValue={inputData.defaultValue ? dayjs(inputData.defaultValue).locale("en-gb") : null}
                    rules={{required: input.pattern?.required}}
                    render={({field: {onChange, value}, fieldState: {error}}) => (
                          <DatePicker
                                id={inputData.id}
                                label={inputData.label}
                                disabled={input.disabled}
                                sx={{bgcolor: 'background.default'}}
                                value={value ? dayjs(value).locale("en-gb") : null}
                                onChange={(date) => {
                                    onChange(date ? date.format("YYYY-MM-DD") : null); // Store the date in ISO format
                                    if (input.onChange) {
                                        input.onChange(date, setValue);
                                    }
                                }}
                                slotProps={{
                                    textField: {
                                        error: !!error,
                                        helperText: error ? input.pattern.message : "",
                                        inputProps: {
                                            placeholder: "DD/MM/YYYY",
                                        },
                                    },
                                }}
                          />
                    )}
              />
          </FormControl>
    );
}
