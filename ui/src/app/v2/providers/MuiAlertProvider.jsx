"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert, Snackbar } from "@mui/material";

export const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [message, setAlertError] = useState(null);
  const [severity, setSeverity] = useState("error");
  const [open, setOpen] = useState(false);

  const handleClose = useCallback(() => {
    setOpen(false);
    setAlertError(null);
  }, []);

  useEffect(() => {
    setOpen(Boolean(message && message.length > 0));
  }, [message]);

  return (
    <AlertContext.Provider value={{ setAlertError, setSeverity }}>
      <Snackbar open={open} onClose={handleClose} autoHideDuration={3000}>
        <Alert severity={severity} variant="filled" onClose={handleClose}>
          {message}
        </Alert>
      </Snackbar>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlertContext() {
  const context = useContext(AlertContext);
  return context;
}

// Legacy aliases — keep old imports working
export { AlertProvider as MuiAlertProvider };
export { AlertContext as MuiAlertContext };
