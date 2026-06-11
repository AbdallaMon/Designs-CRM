// Sales-stages feature barrel. SalesStagePanel is the lead-scoped stage-progression UI (stepper
// strip + advance/rollback CTAs); SalesStagesPanel is the older thin wiring smoke-screen (kept).
export { SalesStagePanel } from "./pages/SalesStagePanel.jsx";
export { SalesStagesPanel, default as SalesStagesPanelDefault } from "./pages/SalesStagesPanel.jsx";
export { salesStagesService } from "./salesStages.service.js";
export { runSalesStagesMutation } from "./salesStages.mutations.js";
export { resolveSalesStagesMessage, salesStagesMessages } from "./config/salesStagesMessages.js";
