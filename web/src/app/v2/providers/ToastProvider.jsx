"use client";
import { createContext, useContext, useState } from "react";
import { ToastContainer } from "react-toastify";

export const ToastContext = createContext(null);

/**
 * v2-native toast provider. Mount once at the root of any v2 layout.
 * Provides { loading, setLoading } via context.
 */
export function ToastProvider({ children }) {
  const [loading, setLoading] = useState(false);

  return (
    <ToastContext.Provider value={{ loading, setLoading }}>
      {loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999997,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        />
      )}
      <ToastContainer
        position="top-center"
        style={{ width: "80%", maxWidth: "600px", zIndex: 9999999 }}
        closeOnClick
        pauseOnHover={false}
        autoClose={3000}
      />
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context)
    throw new Error("useToastContext must be used within ToastProvider");
  return context;
}
