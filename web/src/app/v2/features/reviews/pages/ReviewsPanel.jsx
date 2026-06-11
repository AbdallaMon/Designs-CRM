"use client";

// ReviewsPanel — RETIRED. The thin wiring smoke-screen has been replaced by the redesigned
// read-only ReviewsScreen (UX plan §3.7). This module is kept as a back-compat alias so any
// existing import of `ReviewsPanel` keeps working; all real UI lives in ReviewsScreen.

export { ReviewsScreen as ReviewsPanel, default } from "./ReviewsScreen.jsx";
