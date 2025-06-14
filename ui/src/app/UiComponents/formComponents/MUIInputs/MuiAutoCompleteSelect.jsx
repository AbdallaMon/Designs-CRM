import React, {useEffect, useState} from "react";
import {
    FormControl,
    FormHelperText,
    InputLabel,
    CircularProgress,
    Autocomplete,
    TextField,
    MenuItem, Box,
} from "@mui/material";
import {Controller} from "react-hook-form";

export function MuiAutoCompleteSelect({
                                          select,
                                          variant,
                                          control,
                                          errors,
                                          extraData,
                                          disabled,
                                          triggerValue,
                                          reFetch,
                                      }) {
    return (
          <MUIAutoComplete
                select={select}
                errors={errors}
                variant={variant}
                control={control}
                extraData={extraData}
                disabled={disabled}
                reFetch={reFetch}
                triggerValue={triggerValue}
          />
    );
}

function Select({select, variant, control, errors}) {
    const getData = select.getData;
    const selectData = select.data;
    const [options, setOptions] = useState(select.options);
    const [loading, setLoading] = useState(getData);
    const fullWidth = select.fullWidth;
    const [value, setValue] = useState(select.value);

    const handleChange = (event) => {
        setValue(event.target.value);
    };

    useEffect(() => {
        if (!options && getData) {
            async function fetchOptions() {
                setLoading(true);
                const fetchedOptions = await getData();
                setOptions(fetchedOptions.data);
                setLoading(false);
            }

            fetchOptions();
        }
    }, [getData, options]);

    return (
          <FormControl fullWidth={fullWidth} sx={select.sx ? select.sx : {mb: 2}}>
              <InputLabel id="demo-simple-select-label">{selectData.label}</InputLabel>
              <Controller
                    name={selectData.id}
                    control={control}
                    defaultValue={value}
                    rules={select.pattern}
                    render={({field}) => (
                          <Select
                                {...field}
                                {...selectData}
                                value={value}
                                onChange={(event) => {
                                    handleChange(event);
                                    field.onChange(event);
                                }}
                                error={errors?.[selectData.id]}
                                variant={variant}
                          >
                              {loading && "جاري تحميل الخيارات"}
                              {options?.map((option) => (
                                    <MenuItem value={option.value} key={option.label}>
                                        {option.label}
                                    </MenuItem>
                              ))}
                          </Select>
                    )}
              />
              <FormHelperText>{errors[selectData.id]?.message}</FormHelperText>
          </FormControl>
    );
}

function MUIAutoComplete({
                             select,
                             variant,
                             control,
                             errors,
                             extraData,
                             disabled,
                             reFetch,
                             triggerValue,
                         }) {
    const getData = select.getData;
    const selectData = select.data;
    const [options, setOptions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const fullWidth = select.fullWidth;
    const [value, setValue] = useState(null);
    const onChange = select.onChange;
    const [opened, setOpened] = useState(false);
    const [changed, setChanged] = useState(false);
    useEffect(() => {
        if (select.data.defaultValue && !value && !changed) {
            handleOpen();
            setValue(select.data.defaultValue);
            triggerValue(selectData.id, select.data.defaultValue);
            handleClose();
        }
    }, [select]);

    const handleOpen = async () => {
        setOpen(true);
        if (getData && (!opened || select.rerender)) {
            setLoading(true);
            const fetchedOptions = await getData();
            setOptions(fetchedOptions.data);
            setLoading(false);
            if (!select.rerender) {
                setOpened(true);
            }
        }
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleChange = (event, newValue) => {
        setValue(newValue ? newValue.id : "");
        if (onChange) {
            onChange(newValue ? newValue.id : null);
        }
        setChanged(true);
    };

    return (
          <FormControl
                fullWidth={fullWidth}
                sx={{
                    ...select.sx,
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: select.createData && 2,
                    mb: 2,
                }}
          >
              <Box display="flex" width="full">
                  <Controller
                        name={selectData.id}
                        control={control}
                        rules={select.pattern}
                        sx={{
                            direction: "ltr"

                        }}
                        render={({field}) => (
                              <Autocomplete
                                    open={open}
                                    onOpen={handleOpen}
                                    onClose={handleClose}
                                    getOptionDisabled={(option) => option.disabled} // Disable options based on the 'disabled' property
                                    onChange={(event, newValue) => {
                                        handleChange(event, newValue);
                                        field.onChange(newValue ? newValue.id : null);
                                    }}
                                    sx={{}}
                                    value={
                                        value !== null
                                              ? options?.find((option) => option.id == value)
                                              : null
                                    }
                                    options={options ? options : []}
                                    loading={loading}
                                    disabled={
                                          (disabled && disabled[selectData.id]) ||
                                          selectData.disabled ||
                                          select.disabled
                                    }
                                    getOptionLabel={(option) => option.name || ""}
                                    renderInput={(params) => (
                                          <TextField
                                                {...params}
                                                label={selectData.label}
                                                variant={variant}
                                                error={Boolean(errors[selectData.id])}
                                                helperText={errors[selectData.id]?.message}
                                                sx={{
                                                    "& .MuiAutocomplete-input": {
                                                        direction: 'ltr'
                                                    }
                                                }}
                                                InputProps={{
                                                    ...params.InputProps,
                                                    readOnly: selectData.disabled,
                                                    endAdornment: (
                                                          <>
                                                              {loading ? (
                                                                    <CircularProgress color="inherit" size={20}/>
                                                              ) : null}
                                                              {params.InputProps.endAdornment}
                                                          </>
                                                    ),
                                                }}
                                          />
                                    )}
                              />
                        )}
                  />
              </Box>
          </FormControl>
    );
}
