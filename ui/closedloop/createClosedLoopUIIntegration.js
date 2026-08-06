/**
 * Baccarat Analyzer V10.1
 * Path: ui/closedloop/createClosedLoopUIIntegration.js
 * Purpose: Factory for V10.1 AI Closed-Loop UI Integration.
 */
import ClosedLoopUIStore from "./ClosedLoopUIStore.js";import ClosedLoopUIViewModel from "./ClosedLoopUIViewModel.js";import ClosedLoopUIRenderer from "./ClosedLoopUIRenderer.js";import ClosedLoopOutcomeCollector from "./ClosedLoopOutcomeCollector.js";import ClosedLoopUIController from "./ClosedLoopUIController.js";import ClosedLoopUIEventBinder from "./ClosedLoopUIEventBinder.js";import ClosedLoopUIIntegration from "./ClosedLoopUIIntegration.js";
export const CLOSED_LOOP_UI_INTEGRATION_FACTORY_VERSION="10.1.0";
export default function createClosedLoopUIIntegration({root,runtime,observationProvider=null,outcomeProvider=null,eventBus=null,selectors={}}={}){const store=new ClosedLoopUIStore();const viewModel=new ClosedLoopUIViewModel({store});const renderer=new ClosedLoopUIRenderer({root,selectors});const controller=new ClosedLoopUIController({runtime,viewModel,outcomeCollector:new ClosedLoopOutcomeCollector(),observationProvider,eventBus});const eventBinder=new ClosedLoopUIEventBinder({controller,renderer,outcomeProvider});return new ClosedLoopUIIntegration({store,viewModel,renderer,controller,eventBinder});}
