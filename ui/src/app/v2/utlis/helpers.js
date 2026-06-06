// src/utils/helpers.js
// Shared utility functions — date, money, string, URL helpers

import dayjs from "dayjs";
import "dayjs/locale/ar";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale("ar");

// ── Date ──────────────────────────────────────────────────────
export function formatDate(date, format = "DD/MM/YYYY") {
  return dayjs(date).format(format);
}

export function formatDateTime(date) {
  return dayjs(date).format("DD/MM/YYYY HH:mm");
}

export function formatDateAr(date) {
  return dayjs(date).locale("ar").format("D MMMM YYYY");
}

export function fromNow(date) {
  return dayjs(date).locale("ar").fromNow();
}

export function formatTime(date) {
  return dayjs(date).format("HH:mm");
}

// ── Money ─────────────────────────────────────────────────────
export function formatCurrency(amount, currency = "OMR") {
  if (amount == null) return "—";
  return `${Number(amount).toFixed(3)} ${currency}`;
}

// ── Booking duration ──────────────────────────────────────────
export function durationLabel(hours) {
  if (hours === 0) return "عدة أيام";
  if (hours === 6) return "٦ ساعات";
  if (hours === 12) return "١٢ ساعة";
  if (hours === 24) return "يوم كامل";
  return `${hours} ساعة`;
}

// ── String ────────────────────────────────────────────────────
export function truncate(str, length = 60) {
  if (!str) return "";
  return str.length > length ? `${str.slice(0, length)}...` : str;
}

export function initials(name = "") {
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ── URL ───────────────────────────────────────────────────────
export function buildQueryString(params = {}) {
  const filtered = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (!filtered.length) return "";
  return "?" + new URLSearchParams(Object.fromEntries(filtered)).toString();
}

// ── Numerals ──────────────────────────────────────────────────
export function toArabicNumerals(num) {
  const map = {
    0: "٠",
    1: "١",
    2: "٢",
    3: "٣",
    4: "٤",
    5: "٥",
    6: "٦",
    7: "٧",
    8: "٨",
    9: "٩",
  };
  return String(num).replace(/[0-9]/g, (d) => map[d]);
}

// ── File ──────────────────────────────────────────────────────
export function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
