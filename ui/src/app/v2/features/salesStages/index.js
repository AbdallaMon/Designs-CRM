// Sales-stages feature barrel (foundation phase — data layer + a thin lead-scoped wiring panel).
export { SalesStagesPanel, default as SalesStagesPanelDefault } from "./pages/SalesStagesPanel.jsx";
export { salesStagesService } from "./salesStages.service.js";
export { runSalesStagesMutation } from "./salesStages.mutations.js";
export { resolveSalesStagesMessage, salesStagesMessages } from "./config/salesStagesMessages.js";
