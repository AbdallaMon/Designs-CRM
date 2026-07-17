"use client";
import { useEffect, useState } from "react";
import styles from "./DotsLoader.module.css";
import { Box } from "@mui/material";

export default function DotsLoader({ instantLoading }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && !instantLoading) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      const dotContainer = document.querySelector(".dot_container");
      window.setTimeout(() => {
        dotContainer.remove();
      }, 100);
    }
  }, [loading]);

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
