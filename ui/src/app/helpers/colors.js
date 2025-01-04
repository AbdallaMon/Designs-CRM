import {AiOutlineEdit, AiOutlineFileText, AiOutlineUserAdd} from "react-icons/ai";
import {BiNote, BiTransfer} from "react-icons/bi";
import {MdAttachMoney, MdCall} from "react-icons/md";
import {FaFileUpload} from "react-icons/fa";
import React from "react";

const colors = {
    "primary": "#0d9488",           // Teal
    "primaryDark": "#0f766e",       // Dark teal
    "primaryAlt": "#f0fdfa",        // Light teal bg #0d94882b
    "primaryGradient": "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
    "secondary": "#6366f1",         // Indigo
    "secondaryDark": "#4f46e5",     // Deep indigo
    "secondaryAlt": "#eef2ff",      // Light indigo bg
    "secondaryText": "#334155",     // Slate text
    "body": "#f9fafb",             // Off-white
    "bgPrimary": "#ffffff",        // Pure white
    "bgSecondary": "#f8fafc",      // Light gray
    "bgTertiary": "#f9fafb",       // Off-white
    "textColor": "#475569",        // Medium gray
    "heading": "#134e4a",          // Deep teal-black
    "paperBg": "#f1f5f9",          // Light gray
    "success": "#10b981",          // Emerald
    "warning": "#f59e0b",          // Amber
    "error": "#ef4444",            // Red
    "info": "#3b82f6",             // Blue
}
export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
export const STATUS_COLORS = {
    NEW: '#8884d8',
    IN_PROGRESS: '#00C49F',
    INTERESTED: '#FFBB28',
    NEEDS_IDENTIFIED: '#FF8042',
    NEGOTIATING: '#0088FE',
    CONVERTED: '#00C49F',
    REJECTED: '#FFBB28',
    ON_HOLD: '#FF8042',
};
export const NotificationColors = {
    NEW_LEAD: "#4caf50",
    LEAD_ASSIGNED: "#2196f3",
    LEAD_STATUS_CHANGE: "#ff9800",
    LEAD_TRANSFERRED: "#f44336",
    LEAD_UPDATED: "#03a9f4",
    LEAD_CONTACT: "#009688",
    NOTE_ADDED: "#9c27b0",
    NEW_NOTE: "#673ab7",
    NEW_FILE: "#3f51b5",
    CALL_REMINDER_CREATED: "#00bcd4",
    CALL_REMINDER_STATUS: "#ff5722",
    PRICE_OFFER_SUBMITTED: "#8bc34a",
    PRICE_OFFER_UPDATED: "#cddc39",
    FINAL_PRICE_ADDED: "#ffc107",
    FINAL_PRICE_CHANGED: "#e91e63",
    OTHER: "#607d8b",
};

export default colors;
