"use client";
import { createContext, useContext, useState } from "react";

export const UploadingContext = createContext(null);
export default function UploadingProvider({ children }) {
  const [progress, setProgress] = useState(0);
  const [overLay, setOverlay] = useState(false);

  return (
    <UploadingContext.Provider value={{ progress, setProgress, setOverlay }}>
      <>
        {overLay && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 99999999,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.6)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#fff",
              fontSize: "20px",
              flexDirection: "column",
            }}
          >
            <div
              style={{ width: "80%", backgroundColor: "#444", borderRadius: 5 }}
            >
              <div
                style={{
                  height: "10px",
                  width: `${progress}%`,
                  backgroundColor: "#4ade80", // green
                  borderRadius: 5,
                  transition: "width 0.2s ease",
                }}
              ></div>
            </div>
            <p style={{ marginTop: 10 }}>{progress}% uploaded</p>
          </div>
        )}
        {children}
      </>
    </UploadingContext.Provider>
  );
}
export const useUploadContext = () => {
  const context = useContext(UploadingContext);
  return context;
};
