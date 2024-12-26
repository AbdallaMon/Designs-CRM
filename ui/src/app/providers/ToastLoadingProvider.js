"use client";
import { createContext, useContext, useState } from "react";
import { WrapperWithToast } from "@/app/UiComponents/feedback/loaders/toast/WrapperWithToast";

export const ToastContext = createContext(null);
export default function ToastProvider({ children }) {
  const [loading, setLoading] = useState(false);
  return (
    <ToastContext.Provider value={{ setLoading }}>
      <WrapperWithToast loading={loading} />
      {children}
    </ToastContext.Provider>
  );
}
export const useToastContext = () => {
  const context = useContext(ToastContext);
  return context;
};
