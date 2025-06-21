// Keeping your main colors and expanding with more modern, cohesive shades.
const colors = {
  // Enhanced Primary Colors - Refined Caramel Identity
  primary: "#d4a574", // Slightly warmer and more vibrant caramel
  primaryDark: "#b5925c", // Rich, deeper caramel
  primaryLight: "#e8c392", // Brighter, more luminous light
  primaryAlt: "#faf5ef", // Cleaner, more pristine background
  primaryGradient:
    "linear-gradient(135deg, #b5925c 0%, #d4a574 35%, #e8c392 100%)",
  primaryAccent: "#c7a16a", // Perfect mid-tone for UI elements

  // Sophisticated Secondary Colors - Warm Cognac
  secondary: "#c8956a", // Richer cognac tone
  secondaryDark: "#a67c55", // Deep cognac
  secondaryLight: "#dbb088", // Light cognac
  secondaryAlt: "#f7f0e8", // Elegant light background
  secondaryText: "#744d37", // Strong, readable cognac text
  secondaryAccent: "#b68660", // Refined cognac accent

  // Modern Background System
  body: "#f8f5f1", // Warmer, more inviting base
  bgPrimary: "#f1ece6", // Sophisticated warm linen
  bgSecondary: "#fcfaf7", // Clean, premium white
  bgTertiary: "#e8e2db", // Enhanced contrast background
  bgQuaternary: "#dfd8cf", // Additional depth layer
  paperBg: "#ffffff", // Pure white for cards/papers
  surfaceElevated: "#f4efe9", // Subtle elevated surfaces

  // Enhanced Text Hierarchy
  textPrimary: "#3d342a", // Stronger, more readable primary
  textSecondary: "#5c5147", // Refined secondary text
  textTertiary: "#7a6f63", // Balanced tertiary text
  textMuted: "#9a8e82", // Softer muted text
  heading: "#2a221a", // Rich, deep headings for impact
  textOnPrimary: "#ffffff", // Crisp white on primary
  textOnSecondary: "#2a221a", // Dark on secondary

  // Vibrant Status Colors (keeping caramel identity)
  success: "#6b8c5a", // More vibrant sage green
  successLight: "#9bb386", // Brighter success light
  successDark: "#556e47", // Deeper success
  warning: "#d4a574", // Your enhanced caramel as warning
  warningLight: "#e8c392", // Light warning
  warningDark: "#b5925c", // Dark warning
  error: "#c2695f", // More vibrant coral-red
  errorLight: "#d48f86", // Softer error light
  errorDark: "#9f544c", // Deeper error
  info: "#6a85a3", // Enhanced blue-gray with more personality
  infoLight: "#92a6bf", // Lighter info
  infoDark: "#556b82", // Deeper info

  // Refined Accent System
  accent: "#e5b36d", // Golden accent with more pop
  highlight: "#f2e6d4", // Warmer highlight
  border: "#d6cdc2", // Cleaner, more defined borders
  borderLight: "#e5dcd1", // Light borders
  borderDark: "#c4b8ab", // Strong borders for definition
  shadow: "rgba(42, 34, 26, 0.08)", // Softer, more natural shadows
  shadowDark: "rgba(42, 34, 26, 0.16)", // Deeper shadows with warmth
  shadowStrong: "rgba(42, 34, 26, 0.24)", // For elevated components
};
export const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];
export const STATUS_COLORS = {
  NEW: "#8884d8",
  IN_PROGRESS: "#00C49F",
  INTERESTED: "#FFBB28",
  NEEDS_IDENTIFIED: "#FF8042",
  NEGOTIATING: "#0088FE",
  CONVERTED: "#00C49F",
  REJECTED: "#FFBB28",
  ON_HOLD: "#FF8042",
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
