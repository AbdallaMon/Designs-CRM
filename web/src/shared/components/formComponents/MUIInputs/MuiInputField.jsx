"use client";
import {IconButton, InputAdornment, TextField} from "@mui/material";
import {useEffect, useRef, useState} from "react";
import {FaRegEye} from "react-icons/fa";
import {FaRegEyeSlash} from "react-icons/fa6";

export default function MuiInputField({
                                          input,
                                          variant = "filled",
                                          register,
                                          errors,
                                          watch,
                                          trigger, setValue
                                      }) {
    const [inputData, setInputData] = useState(input.data);
    const [showPassword, setShowPassword] = useState(false);
    const inputRef = useRef(null);
    const [type, setType] = useState(null);
    const fieldValue = watch(inputData.id);


    function handleChange(event) {
        input.onChange && input.onChange(event, setValue, watch)
    }

    useEffect(() => {

    }, [])
    const handleClickShowPassword = () => {
        setInputData({
            ...inputData,
            type: inputData.type === "password" ? "text" : "password",
        });
    };


    useEffect(() => {
        if (type) {
            if (input.data.type === "password" || input.data.type === "email") {
                trigger(inputData.id);
            }
        }
    }, [fieldValue]);

    useEffect(() => {
        setShowPassword(inputData.type !== "text");
    }, [inputData.type]);

    // Never spread the raw config's `key`/`helperText` into the MUI field: `key` in a
    // spread is rejected by React 19 (the muiName/removeChild crash) and `helperText` would
    // clobber the validation message handled explicitly below. Everything else (id/type/
    // label/...) is passed through unchanged.
    const { key: _ignoredKey, helperText: _ignoredHelper, ...inputProps } = inputData;

    // MUI TextField only accepts "standard" | "filled" | "outlined"; any other value (e.g. a
    // Button "contained" variant passed to the form by mistake) makes MUI resolve an undefined
    // input component and throw "Cannot read properties of undefined (reading 'muiName')".
    // Fall back to "filled" so a stray variant can never crash the form.
    const safeVariant = ["standard", "filled", "outlined"].includes(variant)
        ? variant
        : "filled";

    return (
          <TextField
                fullWidth
                sx={(theme) => ({
                    backgroundColor: safeVariant === "outlined" ? theme.palette.background.default : 'inherit',
                    width: "100%",
                    ...(input.sx && input.sx),
                })}
                onInput={() => setType(true)}
                variant={safeVariant}
                error={Boolean(errors[inputData.id])}
                disabled={input.disabled}
                helperText={errors[inputData.id]?.message ? errors[inputData.id]?.message : inputData.helperText}
                margin="none"
                ref={inputRef}
                onChange={handleChange}
                {...inputProps}
                {...register(inputData.id, input.pattern)}
                InputProps={{
                    endAdornment: input.data.type === "password" && (
                          <InputAdornment position="end">
                              <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleClickShowPassword}
                                    edge="end"

                              >
                                  {showPassword ? <FaRegEyeSlash/> : <FaRegEye/>}
                              </IconButton>
                          </InputAdornment>
                    ),
                }}
          />
    );
}
