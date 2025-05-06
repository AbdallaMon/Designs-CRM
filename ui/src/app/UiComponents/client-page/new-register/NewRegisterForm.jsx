"use client";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useLanguageContext } from "@/app/providers/LanguageProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  Box,
  Button,
  Divider,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
  Grid2 as Grid,
} from "@mui/material";
import { matchIsValidTel, MuiTelInput } from "mui-tel-input";
import { useEffect, useState } from "react";
import {
  IoArrowBackCircleOutline,
  IoArrowForwardCircleOutline,
} from "react-icons/io5";
import { MdEmail, MdPerson } from "react-icons/md";
import { SuccessPage } from "../FinalSelectionForm";
import { Header } from "../LeacComponents";

export function NewRegisterForm() {
  const { translate, lng } = useLanguageContext();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [renderSuccess, setRenderSuccess] = useState(false);
  const [clientLead, setClientLead] = useState(null);
  const { setAlertError } = useAlertContext();
  const { setLoading } = useToastContext();
  const [defaultCountry, setDefaultCountry] = useState("AE");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone" && !/^\d*$/.test(value)) {
      return; // Prevent setting invalid value
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  function handlePhoneChange(value) {
    setFormData((prev) => ({ ...prev, phone: value }));
  }
  async function getDefaultCountryCode() {
    const defaultCountry = "AE";

    const response = await fetch("https://geolocation-db.com/json/");
    const data = await response.json();
    if (data?.country_code === "Not found") {
      return defaultCountry;
    }
    return data?.country_code || defaultCountry;
  }
  useEffect(() => {
    getDefaultCountryCode().then((code) => {
      setDefaultCountry(code);
    });
  }, []);
  const handleSubmit = async () => {
    const { name, phone, email } = formData;
    if (!matchIsValidTel(phone)) {
      setAlertError(translate("Invalid phone"));
      return;
    }
    if (!name || !phone || !email) {
      setAlertError(translate("Please fill all the fields."));
      return;
    }

    const data = { ...formData, lng };
    const request = await handleRequestSubmit(
      data,
      setLoading,
      "client/new-lead/register",
      false,
      translate("Submitting")
    );
    if (request.status === 200) {
      setRenderSuccess(true);
      setClientLead(request.data);
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        overflowY: "auto",
        maxWidth: isMobile ? "100%" : "800px",
        mx: "auto",
        padding: { xs: 2, md: 3 },
        pt: { xs: 10, md: 11 },
        pb: { xs: 10, md: 11 },
      }}
    >
      {renderSuccess ? (
        <SuccessPage clientLead={clientLead} lng={lng} />
      ) : (
        <Paper
          elevation={6}
          sx={{
            padding: { xs: 3, md: 5 },
            borderRadius: 4,
            background: "linear-gradient(145deg, #ffffff 0%, #f7f9fc 100%)",
            direction: lng === "ar" ? "rtl" : "ltr",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.07)",
          }}
        >
          <Header />
          <Box mb={4} textAlign="center">
            <Typography
              variant="h4"
              component="h3"
              sx={{
                fontWeight: 800,
                color: theme.palette.primary.main,
                mb: 1,
                letterSpacing: "-0.5px",
              }}
            >
              {translate("Book a meeting")}
            </Typography>
            <Typography
              variant="h5"
              component="h4"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                mb: 1,
                letterSpacing: "-0.5px",
              }}
            >
              {translate("With eng ahmed")}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: "text.secondary",
                maxWidth: "80%",
                mx: "auto",
                mb: 1,
              }}
            >
              {translate("Planning - Design - Implementation - Consulting")}
            </Typography>
            {/* <Divider
              sx={{
                width: "60px",
                mx: "auto",
                borderWidth: "2px",
                borderColor: theme.palette.primary.main,
                mb: 4,
              }}
            /> */}
          </Box>

          <Grid container spacing={3}>
            <Grid size={12}>
              <TextField
                fullWidth
                label={translate("Name")}
                name="name"
                variant="outlined"
                value={formData.name}
                onChange={handleChange}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <MdPerson color="primary" />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      direction: "ltr",

                      py: 0.5,
                      "&:hover": {
                        "& fieldset": {
                          borderColor: "primary.main",
                          borderWidth: "2px",
                        },
                      },
                    },
                  },
                }}
              />
            </Grid>

            <Grid size={12}>
              <MuiTelInput
                defaultCountry={defaultCountry}
                value={formData.phone}
                id="phone"
                name="phone"
                label={translate("Phone")}
                onChange={handlePhoneChange}
                error={
                  matchIsValidTel(formData.phone) || formData.phone === ""
                    ? false
                    : true
                }
                helperText={
                  matchIsValidTel(formData.phone) || formData.phone === ""
                    ? ""
                    : translate("Invalid phone number")
                }
                fullWidth
                required
                sx={{
                  "& .MuiInputBase-root": {
                    borderRadius: 2,
                    py: 0.5,
                  },
                  "&:hover fieldset": {
                    borderColor: "primary.main",
                    borderWidth: "2px",
                  },
                }}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label={translate("Email")}
                name="email"
                type="email"
                variant="outlined"
                value={formData.email}
                onChange={handleChange}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <MdEmail color="primary" />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      direction: "ltr",

                      py: 0.5,
                      "&:hover": {
                        "& fieldset": {
                          borderColor: "primary.main",
                          borderWidth: "2px",
                        },
                      },
                    },
                  },
                }}
              />
            </Grid>
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
              }}
            >
              <iframe
                style={{
                  width: "100%",
                  height: isMobile ? "200px" : "300px",
                  borderRadius: "8px",
                  border: "none",
                }}
                // style={{
                //   position: "absolute",
                //   top: 0,
                //   left: 0,
                //   width: "100%",
                //   height: "100%",
                //   borderRadius: "8px",
                //   border: "none",
                // }}
                src="https://www.youtube.com/embed/n7uwPCkOv28"
                title="YouTube Shorts video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </Box>
            <Grid size={12}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "column" },
                  alignItems: { xs: "stretch", sm: "center" },
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  size="large"
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    padding: "16px",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    textTransform: "none",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s ease",
                    display: "flex",
                    gap: 0.5,
                    flexDirection: lng === "ar" ? "row" : "row-reverse",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
                    },
                  }}
                >
                  {lng === "ar" ? (
                    <IoArrowBackCircleOutline />
                  ) : (
                    <IoArrowForwardCircleOutline />
                  )}
                  {translate("Book Now 29 DOLLAR")}
                </Button>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body1"
                    fontWeight={500}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      textAlign: "center",
                    }}
                  >
                    {translate(
                      "Your time and ours is valuable, which is why this appointment is reserved for serious clients with a small symbolic fee that will be fully deducted upon signing a contract."
                    )}{" "}
                  </Typography>
                </Box>
              </Box>
              {/* <Button
                variant="contained"
                onClick={handleSubmit}
                size="large"
                fullWidth
                sx={{
                  borderRadius: 2,
                  padding: "16px",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  textTransform: "none",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.3s ease",
                  display: "flex",
                  gap: 0.5,
                  flexDirection: lng === "ar" ? "row" : "row-reverse",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
                  },
                }}
              >
                {lng === "ar" ? (
                  <IoArrowBackCircleOutline />
                ) : (
                  <IoArrowForwardCircleOutline />
                )}
                {translate("Book Now 29 DOLLAR")}
              </Button> */}
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}
