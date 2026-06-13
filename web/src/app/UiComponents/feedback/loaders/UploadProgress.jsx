"use client";

export default function UploadOverlay({ visible, progress }) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
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
      <div style={{ width: "80%", backgroundColor: "#444", borderRadius: 5 }}>
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
  );
}
