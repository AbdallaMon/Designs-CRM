"use client";
import { useEffect, useState } from "react";
import styles from "./DotsLoader.module.css";
import { Box } from "@mui/material";

export default function DotsLoader({ instantLoading }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && !instantLoading) {
      // The server-rendered loader is removed once the client is ready.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [instantLoading]);

  if (!loading) return null;

  return (
    <div className={`dot_container ${styles.dot_container}`}>
      <Box sx={{ width: "100%", height: "20px", textAlign: "center" }}>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
      </Box>
    </div>
  );
}
