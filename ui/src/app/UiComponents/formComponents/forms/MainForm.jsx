"use client";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useForm } from "react-hook-form";
import { Box, Button, Typography, Grid2 as Grid } from "@mui/material";
import MuiTextAreaField from "@/app/UiComponents/formComponents/MUIInputs/MuiTextAreaField";
import { MuiAutoCompleteSelect } from "@/app/UiComponents/formComponents/MUIInputs/MuiAutoCompleteSelect";
import { MDatePicker } from "@/app/UiComponents/formComponents/MUIInputs/MDatePicker";
import MuiSwitch from "@/app/UiComponents/formComponents/MUIInputs/MuiSwitch";
import { useRef } from "react";
import SimpleSelect from "@/app/UiComponents/formComponents/MUIInputs/SimpleSelect";
import MuiInputField from "@/app/UiComponents/formComponents/MUIInputs/MuiInputField";
import MuiFileField from "@/app/UiComponents/formComponents/MUIInputs/MuiFileField";

const locales = ["en-gb"];

export function MainForm({
  formStyle,
  onSubmit,
  inputs,
  variant,
  formTitle,
  subTitle,
  btnText,
  differentButton,
  children,
  extraData,
  disabled,
  reFetch,
  gridGap = 2,
  removeButton = false,
  data,
}) {
  const {
    formState,
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    control,
    getValues,
    unregister,
  } = useForm();
  const { errors } = formState;
  const formRef = useRef();
  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        my: 3,
      }}
    >
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locales}>
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          style={{ ...formStyle }}
          ref={formRef}
        >
          <Typography
            variant="h4"
            color="primary"
            sx={{
              mb: 3,
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            {formTitle}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: "bold",
              mb: 2,
            }}
          >
            {subTitle}
          </Typography>
          <Grid container spacing={gridGap}>
            {inputs.map((input) => (
              <Grid size={input.size || 12} key={input.data.id}>
                <RenderInputs
                  input={input}
                  watch={watch}
                  setValue={setValue}
                  trigger={trigger}
                  errors={errors}
                  register={register}
                  control={control}
                  disabled={disabled}
                  extraData={extraData}
                  reFetch={reFetch}
                  variant={variant}
                  getValues={getValues}
                  data={data}
                  unregister={unregister}
                />
              </Grid>
            ))}
            {children}
          </Grid>
          {differentButton ? (
            differentButton
          ) : (
            <>
              {!removeButton && (
                <Button
                  type={"submit"}
                  variant={"contained"}
                  sx={{
                    mt: 2,
                    px: 4,
                    py: 1,
                  }}
                >
                  {btnText}
                </Button>
              )}
            </>
          )}
        </form>
      </LocalizationProvider>
    </Box>
  );
}

function RenderInputs({
  input,
  register,
  errors,
  watch,
  trigger,
  variant,
  control,
  disabled,
  extraData,
  reFetch,
  setValue,
  getValues,
  data,
  unregister,
}) {
  switch (input.data.type) {
    case "SelectField":
      return (
        <SimpleSelect
          key={input.data.id}
          select={input}
          register={register}
          errors={errors}
          variant={variant}
          set_value={setValue}
        />
      );
    case "textarea":
      return (
        <MuiTextAreaField
          errors={errors}
          input={input}
          register={register}
          variant={variant}
          control={control}
          key={input.data.id}
        />
      );
    case "select":
      return (
        <MuiAutoCompleteSelect
          errors={errors}
          register={register}
          variant={variant}
          select={input}
          key={input.data.id}
          extraData={extraData}
          disabled={disabled}
          reFetch={reFetch}
          control={control}
          triggerValue={setValue}
        />
      );
    case "date":
      return (
        <MDatePicker
          input={input}
          control={control}
          key={input.data.id}
          errors={errors}
          watch={watch}
          variant={variant}
          setValue={setValue}
        />
      );
    case "switch":
      return (
        <MuiSwitch
          register={register}
          control={control}
          input={input}
          key={input.data.id}
        />
      );
    case "number":
      return (
        <MuiInputField
          key={input.data.id}
          input={input}
          register={register}
          errors={errors}
          variant={variant}
          watch={watch}
          trigger={trigger}
          setValue={setValue}
        />
      );
    case "outComponent":
      const Component = input.data.component;
      return (
        <Component
          input={input}
          setValue={setValue}
          register={register}
          watch={watch}
          trigger={trigger}
          errors={errors}
          variant={variant}
          control={control}
          getValues={getValues}
          data={data}
          unregister={unregister}
        />
      );
    case "file":
      return (
        <MuiFileField
          control={control}
          register={register}
          errors={errors}
          input={input}
          setValue={setValue}
          variant={variant}
        />
      );
    default:
      return (
        <MuiInputField
          key={input.data.id}
          input={input}
          register={register}
          errors={errors}
          variant={variant}
          watch={watch}
          trigger={trigger}
          setValue={setValue}
        />
      );
  }
}
