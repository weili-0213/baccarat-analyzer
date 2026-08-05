/**
 * Baccarat Analyzer V9.3
 * Path: integration/simulation/createAISimulationIntegration.js
 * Purpose: Factory for constructing the complete V9.3 simulation integration.
 */
import AISimulationIntegration from "./AISimulationIntegration.js";
import SimulationInputCollector from "./SimulationInputCollector.js";
import SimulationModeSelector from "./SimulationModeSelector.js";
import ProbabilityGateway from "./ProbabilityGateway.js";
import ExactSimulationGateway from "./ExactSimulationGateway.js";
import MonteCarloSimulationGateway from "./MonteCarloSimulationGateway.js";
import SimulationResultMerger from "./SimulationResultMerger.js";
import SimulationIntegrationHistory from "./SimulationIntegrationHistory.js";

export const AI_SIMULATION_INTEGRATION_FACTORY_VERSION = "9.3.0";

export default function createAISimulationIntegration({
    probability,
    exact,
    monteCarlo,
    collector = null,
    selector = null,
    merger = null,
    history = null,
    eventBus = null,
    clock = () => Date.now()
} = {}) {
    return new AISimulationIntegration({
        collector: collector ?? new SimulationInputCollector(),
        selector: selector ?? new SimulationModeSelector(),
        probabilityGateway: new ProbabilityGateway({ probability }),
        exactGateway: new ExactSimulationGateway({ exact }),
        monteCarloGateway: new MonteCarloSimulationGateway({ monteCarlo }),
        merger: merger ?? new SimulationResultMerger(),
        history: history ?? new SimulationIntegrationHistory(),
        eventBus,
        clock
    });
}
