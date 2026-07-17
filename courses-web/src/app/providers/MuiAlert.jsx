"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
export const MuiAlertContext = createContext(null);

export default function MuiAlertProvider({ children }) {
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
  const context = useContext(MuiAlertContext);
  return context;
};
