import { useState } from "react";

export function useToast() {
  const [severity, setSeverity] = useState("info");
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const showToast = (msg, sev = "info") => {
    setMessage(msg);
    setSeverity(sev);
    setIsOpen(true);
  };
  const closeToast = () => {
    setIsOpen(false);
    setMessage("");
  };
  return {
    severity,
    message,
    isOpen,
    showToast,
    closeToast,
  };
}
