// Sales-stages feature barrel — the standalone, LEAD-SCOPED sales-pipeline screen + its data
// layer (service / mutation runner / message resolver) and the presentation config.
export { SalesStagesPanel, default as SalesStagesPanelDefault } from "./pages/SalesStagesPanel.jsx";
export { LeadPicker } from "./components/LeadPicker.jsx";
export { SalesStagesPipeline } from "./components/SalesStagesPipeline.jsx";
export { salesStagesService } from "./salesStages.service.js";
export { runSalesStagesMutation } from "./salesStages.mutations.js";
export { resolveSalesStagesMessage, salesStagesMessages } from "./config/salesStagesMessages.js";
export {
  PIPELINE,
  SALES_STAGE_LABELS,
  labelForStage,
  buildPipelineView,
} from "./config/salesStagesConfig.js";
