import { Alert, Snackbar, Typography } from "@mui/material";
import React, { useState } from "react";

export function WhatsAppRedirect({ lead }) {
  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  // UAE Country Code
  const UAE_COUNTRY_CODE = "+971";

  // Function to format the phone number correctly
  const formatPhoneNumber = (phone, emirates) => {
    if (!phone) return null;

    let formattedPhone = phone.trim();

    // If lead is OUTSIDE UAE, assume number is already formatted
    if (emirates === "OUTSIDE") {
      return formattedPhone.startsWith("+")
        ? formattedPhone
        : `+${formattedPhone}`;
    }

    // If lead is inside UAE, check if the number already has country code
    if (!formattedPhone.startsWith(UAE_COUNTRY_CODE)) {
      // If number starts with 0, remove it and add the country code
      if (formattedPhone.startsWith("0")) {
        formattedPhone = formattedPhone.slice(1);
      }
      formattedPhone = UAE_COUNTRY_CODE + formattedPhone;
    }

    return formattedPhone;
  };

  // Function to detect device type
  const isMobileDevice = () => {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  };

  // Handle click to open WhatsApp
  const handleWhatsAppClick = (e) => {
    e.preventDefault();

    const formattedPhone = formatPhoneNumber(lead.client.phone, lead.emirate);
    if (!formattedPhone) {
      alert("Invalid phone number");
      return;
    }

    // Open WhatsApp URL based on device type
    // const whatsappUrl = isMobileDevice()
    //   ? `whatsapp://send?phone=${formattedPhone}`
    //   : `https://web.whatsapp.com/send?phone=${formattedPhone}`;

    // Copy phone number to clipboard
    navigator.clipboard.writeText(formattedPhone).then(() => {
      setOpenSnackbar(true); // Show notification

      // Redirect after 1.5 seconds
      setTimeout(() => {
        window.open(`whatsapp://send?phone=${formattedPhone}`, "_blank");
      }, 100);
    });
  };

  return (
    <>
      <Typography color="text.secondary" variant="caption">
        Client Phone
      </Typography>
      <Typography
        variant="body1"
        component="a"
        onClick={handleWhatsAppClick}
        sx={{
          display: "block",
          color: "green",
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        {lead.client.phone} 📱
      </Typography>

      {/* Snackbar Notification */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          📋 Copied Phone Number! Redirecting to WhatsApp...
        </Alert>
      </Snackbar>
    </>
  );
}

export function EmailRedirect({ email }) {
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleClick = (e) => {
    e.preventDefault(); // Prevent default link behavior

    // Copy email to clipboard
    navigator.clipboard.writeText(email).then(() => {
      setOpenSnackbar(true); // Show notification

      // Redirect after a short delay
      setTimeout(() => {
        window.open(
          "https://panel.dreamstudiio.com:8090/snappymail/",
          "_blank"
        );
      }, 1500);
    });
  };

  return (
    <>
      <Typography
        variant="body1"
        component="a"
        onClick={handleClick}
        sx={{
          display: "block",
          color: "blue",
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        {email}
      </Typography>

      {/* Snackbar Notification */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          📋 Copied Email! Redirecting to SnappyMail...
        </Alert>
      </Snackbar>
    </>
  );
}
