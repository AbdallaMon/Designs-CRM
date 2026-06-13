"use client";
import React from "react";
import { Fab } from "@mui/material";
import { FaWhatsapp } from "react-icons/fa";

const FloatingWhatsAppButton = () => {
  const phoneNumber = "+971585564778"; // Your WhatsApp number
  // Detect if the user is on a mobile device
  const isMobileDevice = () => {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  };

  // Construct the WhatsApp URL based on device type
  const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
  //  isMobileDevice()
  //   ? `whatsapp://send?phone=${phoneNumber}`
  //   : `https://web.whatsapp.com/send?phone=${phoneNumber}`;

  return (
    <Fab
      color="success"
      aria-label="WhatsApp"
      target="_blank"
      href={whatsappUrl}
      rel="noopener noreferrer"
      sx={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 1000,
        width: 64, // Increased size of button
        height: 64, // Increased size of button
        bgcolor: "#25D366", // WhatsApp green
        color: "white",
        "&:hover": { bgcolor: "#1EBE5D" }, // Slightly darker on hover
        boxShadow: "0px 6px 14px rgba(0, 0, 0, 0.2)", // More depth
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <FaWhatsapp size={28} /> {/* Increased WhatsApp Icon Size */}
    </Fab>
  );
};

export default FloatingWhatsAppButton;
