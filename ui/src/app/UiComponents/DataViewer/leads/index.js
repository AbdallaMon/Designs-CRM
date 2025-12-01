/**
 * Leads UI Components
 *
 * This module exports all lead-related UI components organized by category.
 *
 * Structure:
 * - core/       - Fundamental UI components (cards, badges, etc.)
 * - dialogs/    - Modal dialogs for lead actions
 * - features/   - Feature-specific components
 * - leadUpdates/ - Lead update management components
 * - pages/      - Full page components
 * - panels/     - Panel/section components
 * - payments/   - Payment-related components
 * - tabs/       - Tab-based content components
 * - utilities/  - Helper/utility components
 * - widgets/    - Small reusable widgets
 */

// Main Dialog
export { default as PreviewLeadDialog } from "./PreviewLeadDialog";

// Core Components
export * from "./core";

// Dialog Components
export * from "./dialogs";

// Feature Components
export * from "./features";

// Lead Updates
export * from "./leadUpdates";

// Page Components
export * from "./pages";

// Panel Components
export * from "./panels";

// Payment Components
export * from "./payments";

// Tab Components
export * from "./tabs";

// Utility Components
export * from "./utilities";

// Widget Components
export * from "./widgets";
