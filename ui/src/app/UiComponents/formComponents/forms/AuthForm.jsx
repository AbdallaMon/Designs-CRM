import {useForm} from "react-hook-form";
import {Button, Typography, Box, Paper, Grid2 as Grid} from "@mui/material";
import MuiInputField from "@/app/UiComponents/formComponents/MUIInputs/MuiInputField";

export default function AuthForm({
                                     inputs,
                                     onSubmit,
                                     btnText,
                                     formTitle,
                                     subTitle,
                                     variant,
                                     children,
                                 }) {
    const {formState, register, handleSubmit, watch, trigger, control} = useForm();
    const {errors} = formState;

    return (
          <Paper
                elevation={6}
                sx={{
                    padding: {xs: 2, md: 4},
                    maxWidth: {xs:"90%",md:400},
                    margin: "auto",
                    borderRadius: 2,
                    backgroundColor: "background.default"
                    , minWidth: {md: 350, lg: 400},

                }}
          >
              <Typography variant="h4"  my={2}>
                  {formTitle}
              </Typography>

              {subTitle && (
                    <Typography
                          variant="subtitle1"
                          align="center"
                    >
                        {subTitle}
                    </Typography>
              )}

              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{mt: 2}}>
                  <Grid container spacing={2}>
                      {inputs.map((input) => (
                            <Grid size={12} key={input.data.id}>
                                <MuiInputField
                                      input={input}
                                      register={register}
                                      errors={errors}
                                      variant={variant}
                                      watch={watch}
                                      trigger={trigger}
                                />
                            </Grid>
                      ))}
                  </Grid>

                  {children && <Box sx={{mt: 2}}>{children}</Box>}

                  <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        sx={{mt: 1.5, py: 1.5}}
                  >
                      {btnText}
                  </Button>
              </Box>
          </Paper>
    );
}
