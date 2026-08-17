"use client";
import { createContext, useContext, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
export const MuiAlertContext = createContext(null);

export default function MuiAlertProvider({ children }) {
  const [error, setAlertError] = useState(null);
  const [severity, setSeverity] = useState("error");
  function handleClose() {
    setAlertError(null);
  }

  return (
    <MuiAlertContext.Provider value={{ setAlertError, setSeverity }}>
      <Snackbar open={Boolean(error)} onClose={handleClose} autoHideDuration={3000}>
        <Alert severity={severity} variant="filled" onClose={handleClose}>
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
