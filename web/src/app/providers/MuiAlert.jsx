"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import {
  AlertProvider as AlertProviderV2,
  useAlertContext as useAlertContextV2,
} from "@/app/v2/providers/MuiAlertProvider";
export const MuiAlertContext = createContext(null);

export default function MuiAlertProvider({ children }) {
  return <AlertProviderV2>{children}</AlertProviderV2>;
  const [error, setAlertError] = useState(null);
  const [severity, setSeverity] = useState("error");
  const [open, setOpen] = useState(false);
  function handleClose() {
    setOpen(false);
    setAlertError(null);
  }
  useEffect(() => {
    if (error && error.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [error]);

  return (
    <MuiAlertContext.Provider value={{ setAlertError, setSeverity }}>
      <Snackbar open={open} onClose={handleClose} autoHideDuration={3000}>
        <Alert severity={"error"} variant="filled" onClose={handleClose}>
          {error}
        </Alert>
      </Snackbar>
      {children}
    </MuiAlertContext.Provider>
  );
}
export const useAlertContext = () => {
  return useAlertContextV2();
  const context = useContext(MuiAlertContext);
  return context;
};
