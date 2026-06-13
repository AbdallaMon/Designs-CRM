"use client";
import {IconButton, InputAdornment, TextField} from "@mui/material";
import {useState, useRef,} from "react";
import {FaRegEye} from "react-icons/fa";
import {FaRegEyeSlash} from "react-icons/fa6";
import {Controller} from "react-hook-form";

export default function PasswordField({
                                          control,
                                          name,
                                          label,
                                          errors,
                                          validationRules,
                                          watch,
                                      }) {
    const [showPassword, setShowPassword] = useState(false);
    const inputRef = useRef(null);

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
          <Controller
                name={name}
                control={control}
                rules={validationRules}
                render={({field}) => (
                      <TextField
                            {...field}
                            fullWidth
                            sx={{
                                mt: 2,
                            }}
                            variant="outlined"
                            label={label}
                            type={showPassword ? "text" : "password"}
                            error={Boolean(errors[name])}
                            helperText={errors[name] ? errors[name].message : ""}
                            inputRef={inputRef}
                            InputProps={{
                                endAdornment: (
                                      <InputAdornment position="end">
                                          <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={handleClickShowPassword}
                                                edge="end"
                                                onMouseEnter={handleMouseEnter}
                                                onMouseLeave={handleMouseLeave}
                                          >
                                              {showPassword ? <FaRegEyeSlash/> : <FaRegEye/>}
                                          </IconButton>
                                      </InputAdornment>
                                ),
                            }}
                      />
                )}
          />
    );
}
