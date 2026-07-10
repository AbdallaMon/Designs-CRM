"use client";

import React from "react";
import { Slide } from "@mui/material";

// Transition for full screen dialog
export const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});
