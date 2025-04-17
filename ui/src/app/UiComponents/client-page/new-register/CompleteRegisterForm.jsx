"use client";
import { useLanguageContext } from "@/app/providers/LanguageProvider.jsx";
import React, { useEffect, useState } from "react";
import { useAlertContext } from "@/app/providers/MuiAlert.jsx";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import {
  countriesByRegion,
  Emirate,
  LeadCategory,
  LeadType,
} from "@/app/helpers/constants.js";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput.jsx";
import { priceRange } from "@/app/UiComponents/client-page/clientPageData.js";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import "dayjs/locale/en-gb";
import { MobileDateTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { CountrySelector } from "../FinalSelectionForm";
import gsap from "gsap";
import { ConsultLevels } from "../consult-levels/ConsultLevels";
export function CompleteRegisterForm({ category, item, location, leadId }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DesignLeadForm
        category={category}
        item={item}
        location={location}
        leadId={leadId}
      />
    </LocalizationProvider>
  );
}
function DesignLeadForm({ category, item, location, leadId }) {
  const { translate, lng } = useLanguageContext();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    emirate: null,
    email: "",
    priceRange: [0, 0],
    priceOption: null,
    file: null,
    clientDescription: null,
    timeToContact: null,
    country: null,
  });
  const [renderSuccess, setRenderSuccess] = useState(false);
  const [clientLead, setClientLead] = useState(null);
  const { setAlertError } = useAlertContext();
  const { setLoading } = useToastContext();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [defaultCountry, setDefaultCountry] = useState("AE");
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone" && !/^\d*$/.test(value)) {
      return; // Prevent setting invalid value
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  function handleDateChange(value) {
    setFormData((prev) => ({ ...prev, timeToContact: value }));
  }
  const handleEmirateChange = (event, newValue) => {
    setFormData((prev) => ({ ...prev, emirate: event.target.value }));
  };
  const handlePriceChange = (index, value) => {
    setFormData((prev) => {
      const newPriceRange = [...prev.priceRange];
      newPriceRange[index] = Number(value) || 0;
      return { ...prev, priceRange: newPriceRange };
    });
  };
  const handleSelectPriceChange = (e) => {
    setFormData((prev) => ({ ...prev, priceOption: e.target.value }));
  };
  async function getDefaultCountryCode() {
    const defaultCountry = "AE";
    if (location === "INSIDE_UAE") {
      return defaultCountry;
    } else {
      const response = await fetch("https://geolocation-db.com/json/");
      const data = await response.json();
      if (data?.country_code === "Not found") {
        return defaultCountry;
      }
      return data?.country_code || defaultCountry;
    }
  }
  useEffect(() => {
    getDefaultCountryCode().then((code) => {
      setDefaultCountry(code);
    });
  }, []);
  const handleSubmit = async () => {
    const { priceRange, emirate, priceOption } = formData;

    if (
      (!emirate && location === "INSIDE_UAE") ||
      (location === "INSIDE_UAE" &&
        priceRange[0] === 0 &&
        priceRange[1] === 0 &&
        !priceOption)
    ) {
      setAlertError(translate("Please fill all the fields."));
      return;
    }
    if (location !== "INSIDE_UAE" && !formData.country) {
      setAlertError(translate("Please fill all the fields."));
      return;
    }
    if (formData.file) {
      const form = new FormData();
      form.append("file", formData.file);
      const fileUpload = await handleRequestSubmit(
        form,
        setLoading,
        "client/upload",
        true,
        translate("Uploading file")
      );
      if (fileUpload.status === 200) {
        const data = {
          ...formData,
          url: fileUpload.fileUrls.file[0],
          category,
          item,
          lng,
          location,
        };
        const request = await handleRequestSubmit(
          data,
          setLoading,
          `client/new-lead/complete-register/${leadId}`,
          false,
          translate("Submitting")
        );
        if (request.status === 200) {
          setRenderSuccess(true);
          setClientLead(request.data);
        }
      }
    } else {
      const data = { ...formData, category, item, lng, location };
      const request = await handleRequestSubmit(
        data,
        setLoading,
        `client/new-lead/complete-register/${leadId}`,
        false,
        translate("Submitting")
      );
      if (request.status === 200) {
        setRenderSuccess(true);
        setClientLead(request.data);
      }
    }
  };
  const emiratesOptions = Object.entries(Emirate).map(([key, value]) => ({
    key,
    label: value,
  }));
  if (!item) return;
  return (
    <>
      <Box
        sx={{
          height: "100%",
          overflowY: "auto",
          minWidth: isMobile ? "100%" : "800px",
        }}
        className="final-selection-form"
      >
        {renderSuccess ? (
          <SuccessPage
            category={category}
            formData={formData}
            clientLead={clientLead}
            lng={lng}
          />
        ) : (
          <Paper
            elevation={4}
            sx={{
              padding: { xs: 2, md: 4 },
              borderRadius: 3,
              background: "linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)",
              direction: lng === "ar" ? "ltr" : "ltr",
            }}
          >
            <Typography
              variant="h4"
              sx={{
                marginBottom: 1,
                textAlign: "center",
                fontWeight: 700,
                color: theme.palette.primary.main,
              }}
            >
              {translate(
                "You're just one step away from starting your project!"
              )}
            </Typography>
            <Box
              sx={{
                marginBottom: 3,
                textAlign: "center",
                display: "flex",
                gap: 2,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="subtitle1">
                {translate(LeadCategory[category]) || ""}
              </Typography>{" "}
              -
              <Typography variant="subtitle1">
                {translate(LeadType[item]) || ""}
              </Typography>
            </Box>
            <Stack spacing={3}>
              {location === "INSIDE_UAE" && (
                <>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="emirate-label">
                      {translate("Select Location")}
                    </InputLabel>
                    <Select
                      labelId="emirate-label"
                      id="emirate"
                      label={translate("Select Location")}
                      value={formData.emirate} // Ensure you define this state
                      onChange={handleEmirateChange}
                    >
                      {emiratesOptions.map((option) => (
                        <MenuItem value={option.key} key={option.key}>
                          {translate(option.label)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {priceRange[item].type === "input" ? (
                    <Box sx={{ mb: 1 }}>
                      <Typography
                        variant="subtitle1"
                        gutterBottom
                        sx={{ mb: 2.5, mt: -1 }}
                      >
                        {translate(
                          "How much would you like to invest in your dream home?"
                        )}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{ mt: -1.5 }}
                      >
                        <TextField
                          type="number"
                          label={translate("Min")}
                          value={formData.priceRange[0]}
                          onChange={(e) => handlePriceChange(0, e.target.value)}
                          sx={{ flex: 1 }}
                          InputProps={{
                            sx: { borderRadius: 2 },
                          }}
                        />
                        <TextField
                          type="number"
                          label={translate("Max")}
                          value={formData.priceRange[1]}
                          onChange={(e) => handlePriceChange(1, e.target.value)}
                          sx={{ flex: 1 }}
                          InputProps={{
                            sx: { borderRadius: 2 },
                          }}
                        />
                      </Stack>
                    </Box>
                  ) : (
                    <>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          marginTop: "8px !important",
                          mb: "-15px !important",
                        }}
                      >
                        {translate(
                          "How much would you like to invest in your dream home?"
                        )}
                      </Typography>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel id="price-range-label">
                          {translate("Budget")}
                        </InputLabel>
                        <Select
                          labelId="price-range-label"
                          id="price-range-select"
                          label={translate("Budget")}
                          value={formData.priceOption} // Ensure you define this state
                          onChange={handleSelectPriceChange}
                        >
                          {priceRange[item].options.map((price) => (
                            <MenuItem value={price} key={price}>
                              {translate(price)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </>
                  )}
                  <TextField
                    fullWidth
                    label={translate("Additional information (optional)")}
                    name="clientDescription"
                    type="text"
                    variant="outlined"
                    value={formData.clientDescription}
                    onChange={handleChange}
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        "&:hover": {
                          "& fieldset": {
                            borderColor: "primary.main",
                          },
                        },
                      },
                    }}
                  />
                </>
              )}
              {location === "INSIDE_UAE" ? (
                <>
                  <MobileDateTimePicker
                    label={translate(
                      "Choose a time to contact you? (optional)"
                    )}
                    disablePast
                    name="timeToContact"
                    value={formData.timeToContact}
                    onChange={handleDateChange}
                    orientation=""
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{ margin: "8px 0 -10px !important" }}
                  >
                    {translate("Choose a time between 10 AM to 7 PM.")}
                  </Typography>
                </>
              ) : (
                <>
                  <CountrySelector
                    label={translate("Country")}
                    name="country"
                    onChange={handleChange}
                    value={formData.country}
                    fullWidth={true}
                  />
                </>
              )}
              <SimpleFileInput
                label={translate("Add an attachment (optional)")}
                id="file"
                setData={setFormData}
                variant="outlined"
              />

              <Button
                variant="contained"
                onClick={handleSubmit}
                size="large"
                sx={{
                  borderRadius: 2,
                  padding: "16px",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow:
                    "0 4px 20px 0 rgba(61, 71, 82, 0.1), 0 0 0 0 rgba(0, 127, 255, 0)",
                }}
              >
                {translate("Submit")}
              </Button>
            </Stack>
          </Paper>
        )}
      </Box>
    </>
  );
}
function ConsultLeadForm({ category }) {
  const { lng } = useLanguageContext();
  useEffect(() => {
    function redirectToPage() {
      window.setTimeout(() => {
        window.location.href = `https://decorstores.ltd/${
          lng === "en" ? lng : ""
        }/products/consultation-with-engineer-ahmed`;
      }, 500);
    }

    // Call the function when the component mounts
    if (category && category === "CONSULTATION") {
      redirectToPage();
    }
  }, [category]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "16px",
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: "bold",
          marginBottom: 1,
          display: "flex",
          gap: 2,
          alignItems: "center",
        }}
      >
        <CircularProgress sx={{ marginBottom: 2 }} />
        {lng === "ar" ? "...نقوم بإعادة توجيهك" : "We are redirecting you..."}
      </Typography>
      <Typography variant="body1" sx={{ color: "gray", marginBottom: 2 }}>
        {lng === "ar"
          ? ".يرجى الانتظار قليلاً بينما نقوم بتحضير الصفحة"
          : "Please wait while we prepare the page for you."}
      </Typography>
    </Box>
  );
}
const orderedCountriesWithRegions = [];
Object.keys(countriesByRegion).forEach((region) => {
  countriesByRegion[region].forEach((country) => {
    orderedCountriesWithRegions.push({
      region,
      country,
    });
  });
});

function SuccessPage({ lng, category, formData }) {
  const { translate } = useLanguageContext();

  useEffect(() => {
    gsap.set(".reverse-button", {
      display: "none",
    });
  }, []);

  return (
    <Paper
      elevation={4}
      sx={{
        padding: 2,
        borderRadius: 3,
        backgroundColor: "#fff",
        textAlign: "center",
      }}
    >
      <Typography variant="body1" mb={1} p={4} fontSize="1.2rem">
        {translate("Thank you for your submission. We will contact you soon.")}
      </Typography>
      <ConsultLevels lng={lng} />
    </Paper>
  );
}
