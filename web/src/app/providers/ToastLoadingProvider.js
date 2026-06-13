"use client";
import { createContext, useContext, useState } from "react";
import { ToastContainer } from "react-toastify";

export const ToastContext = createContext(null);
export default function ToastProvider({ children }) {
  const [loading, setLoading] = useState(false);
  return (
    <ToastContext.Provider value={{ loading, setLoading }}>
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            zIndex: 9999997,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        ></div>
      )}
      <ToastContainer
        position="top-center"
        style={{ width: "80%", maxWidth: "600px", zIndex: 9999999 }}
        closeOnClick={true}
        pauseOnHover={false}
        autoClose={3000}
      />
      {children}
    </ToastContext.Provider>
  );
}
export const useToastContext = () => {
  const context = useContext(ToastContext);
  return context;
};
