
const colors = {
    "primary": "#d3ac71",           // Rich caramel (slightly warmer than original)
    "primaryDark": "#be975c",       // Darker caramel
    "primaryAlt": "#f7eedd",        // Light caramel bg
    "primaryGradient": "linear-gradient(135deg, #be975c 0%, #d3ac71 100%)",

    // Secondary Colors - Warm Cedar
    "secondary": "#e3b79a",         // Cedar brown
    "secondaryDark": "#a07559",     // Dark cedar
    "secondaryAlt": "#f4ebe6",      // Light cedar bg
    "secondaryText": "#785644",     // Deep cedar text

    // Optimized Background Colors
    "body": "#f4f2ee",             // Soft linen gray
    "bgPrimary": "#eae7e2",        // Light linen
    "bgSecondary": "#faf9f7",      // Bright linen
    "bgTertiary": "#e2dfd9",       // Darker linen
    "paperBg": "#fcfbf9",          // Pure linen white

    // Text and Utility Colors
    "textColor": "#584d3f",        // Warm brown-gray
    "heading": "#383028",          // Deep brown

    // Status Colors
    "success": "#849178",          // Muted sage
    "warning": "#d3ac71",          // Caramel tone
    "error": "#bf776e",            // Muted coral
    "info": "#768fa1",             // Muted blue-gray
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
