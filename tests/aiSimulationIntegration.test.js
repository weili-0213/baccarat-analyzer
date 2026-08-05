/**
 * Baccarat Analyzer V9.3
 * Path: tests/aiSimulationIntegration.test.js
 * Purpose: Verifies the complete V9.3 AI Simulation Integration runtime flow.
 */
import {
    SIMULATION_INTEGRATION_STATE_VERSION,
    SimulationIntegrationState,
    SimulationMode
} from "../integration/simulation/SimulationIntegrationState.js";
import SimulationIntegrationContext, {
    SIMULATION_INTEGRATION_CONTEXT_VERSION
} from "../integration/simulation/SimulationIntegrationContext.js";
import SimulationInputCollector, {
    SIMULATION_INPUT_COLLECTOR_VERSION
} from "../integration/simulation/SimulationInputCollector.js";
import ProbabilityGateway, {
    PROBABILITY_GATEWAY_VERSION
} from "../integration/simulation/ProbabilityGateway.js";
import ExactSimulationGateway, {
    EXACT_SIMULATION_GATEWAY_VERSION
} from "../integration/simulation/ExactSimulationGateway.js";
import MonteCarloSimulationGateway, {
    MONTE_CARLO_SIMULATION_GATEWAY_VERSION
} from "../integration/simulation/MonteCarloSimulationGateway.js";
import SimulationModeSelector, {
    SIMULATION_MODE_SELECTOR_VERSION
} from "../integration/simulation/SimulationModeSelector.js";
import SimulationResultMerger, {
    SIMULATION_RESULT_MERGER_VERSION
} from "../integration/simulation/SimulationResultMerger.js";
import SimulationIntegrationHistory, {
    SIMULATION_INTEGRATION_HISTORY_VERSION
} from "../integration/simulation/SimulationIntegrationHistory.js";
import AISimulationIntegration, {
    AI_SIMULATION_INTEGRATION_VERSION,
    SimulationIntegrationEvent
} from "../integration/simulation/AISimulationIntegration.js";
import SimulationIntegrationRuntimeAdapter, {
    SIMULATION_INTEGRATION_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/SimulationIntegrationRuntimeAdapter.js";
import {
    AI_SIMULATION_INTEGRATION_FACTORY_VERSION
} from "../integration/simulation/createAISimulationIntegration.js";

const assert = (condition, message) => {
    if (!condition) throw new Error(message);
};

export default async function aiSimulationIntegrationTest() {
    const messages = [];

    assert(
        [
            SIMULATION_INTEGRATION_STATE_VERSION,
            SIMULATION_INTEGRATION_CONTEXT_VERSION,
            SIMULATION_INPUT_COLLECTOR_VERSION,
            PROBABILITY_GATEWAY_VERSION,
            EXACT_SIMULATION_GATEWAY_VERSION,
            MONTE_CARLO_SIMULATION_GATEWAY_VERSION,
            SIMULATION_MODE_SELECTOR_VERSION,
            SIMULATION_RESULT_MERGER_VERSION,
            SIMULATION_INTEGRATION_HISTORY_VERSION,
            AI_SIMULATION_INTEGRATION_VERSION,
            SIMULATION_INTEGRATION_RUNTIME_ADAPTER_VERSION,
            AI_SIMULATION_INTEGRATION_FACTORY_VERSION
        ].every(version => version === "9.3.0"),
        "V9.3 AI Simulation Integration 版本錯誤"
    );
    assert(SimulationMode.HYBRID === "hybrid", "Simulation Mode 錯誤");
    messages.push("✓ V9.3 AI Simulation Integration 版本正確");

    const context = new SimulationIntegrationContext({
        round: { roundId: "r1" },
        shoe: { remaining: 120 },
        remainingCards: Array.from({ length: 120 }, (_, index) => index),
        mode: "auto",
        iterations: 5000
    });
    assert(
        context.round.roundId === "r1" && context.iterations === 5000,
        "Simulation Integration Context 錯誤"
    );
    messages.push("✓ Simulation Integration Context 正確");

    const collected = new SimulationInputCollector().collect(context);
    assert(
        collected.mode === "auto" && collected.iterations === 5000,
        "Simulation Input Collector 錯誤"
    );
    messages.push("✓ Simulation Input Collector 正確");

    const probability = {
        async calculate() {
            return {
                probabilities: {
                    Player: 0.445,
                    Banker: 0.46,
                    Tie: 0.095
                }
            };
        }
    };
    const exact = {
        async simulate() {
            return {
                probabilities: {
                    Player: 0.44,
                    Banker: 0.465,
                    Tie: 0.095
                }
            };
        }
    };
    const monteCarlo = {
        async simulate(input) {
            return {
                iterations: input.iterations,
                probabilities: {
                    Player: 0.447,
                    Banker: 0.458,
                    Tie: 0.095
                }
            };
        }
    };

    const probabilityGateway = new ProbabilityGateway({ probability });
    const exactGateway = new ExactSimulationGateway({ exact });
    const monteCarloGateway = new MonteCarloSimulationGateway({ monteCarlo });

    assert(
        (await probabilityGateway.calculate({})).probabilities.Banker === 0.46,
        "Probability Gateway 錯誤"
    );
    assert(
        (await exactGateway.simulate({})).probabilities.Banker === 0.465,
        "Exact Simulation Gateway 錯誤"
    );
    assert(
        (await monteCarloGateway.simulate({ iterations: 5000 })).iterations === 5000,
        "Monte Carlo Simulation Gateway 錯誤"
    );
    messages.push("✓ Probability、Exact、Monte Carlo Gateway 正確");

    const selector = new SimulationModeSelector();
    assert(
        selector.select({ requestedMode: "auto", remainingCount: 120 }) === SimulationMode.HYBRID &&
        selector.select({ requestedMode: "auto", remainingCount: 40 }) === SimulationMode.EXACT,
        "Simulation Mode Selector 錯誤"
    );
    messages.push("✓ Simulation Mode Selector 正確");

    const merged = new SimulationResultMerger().merge({
        probability: await probabilityGateway.calculate({}),
        exact: await exactGateway.simulate({}),
        monteCarlo: await monteCarloGateway.simulate({ iterations: 5000 }),
        mode: SimulationMode.HYBRID
    });
    assert(
        merged.bestOutcome === "Banker" &&
        merged.sourceCount === 3 &&
        merged.probabilities.Banker > merged.probabilities.Player,
        "Simulation Result Merger 錯誤"
    );
    messages.push("✓ Simulation Result Merger 正確");

    let now = 100;
    const events = [];
    const integration = new AISimulationIntegration({
        probabilityGateway,
        exactGateway,
        monteCarloGateway,
        history: new SimulationIntegrationHistory({ limit: 20 }),
        eventBus: {
            emit(type, payload) {
                events.push({ type, payload });
            }
        },
        clock: () => now++
    });

    assert(
        integration.state === SimulationIntegrationState.IDLE,
        "Simulation Integration initial state 錯誤"
    );

    const result = await integration.run({ context });
    assert(
        result.mode === SimulationMode.HYBRID &&
        result.exact !== null &&
        result.monteCarlo !== null &&
        result.merged.bestOutcome === "Banker" &&
        integration.state === SimulationIntegrationState.COMPLETED &&
        integration.summary.runCount === 1 &&
        integration.summary.history.count === 1,
        "AI Simulation Integration 錯誤"
    );
    messages.push("✓ Collect → Probability → Exact → Monte Carlo → Merge 正確");

    const exactOnly = await integration.run({
        context: new SimulationIntegrationContext({
            shoe: { remaining: 40 },
            remainingCards: Array.from({ length: 40 }, (_, index) => index),
            mode: "auto"
        })
    });
    assert(
        exactOnly.mode === SimulationMode.EXACT &&
        exactOnly.exact !== null &&
        exactOnly.monteCarlo === null,
        "Exact Mode 錯誤"
    );
    messages.push("✓ Exact Mode 正確");

    integration.pause();
    assert(await integration.run({ context }) === null, "Simulation Integration Pause 錯誤");
    integration.resume();
    assert(
        integration.state === SimulationIntegrationState.IDLE &&
        integration.summary.paused === false,
        "Simulation Integration Resume 錯誤"
    );
    messages.push("✓ Pause／Resume 正確");

    const adapter = new SimulationIntegrationRuntimeAdapter({ integration });
    const adapterResult = await adapter.simulate({ context });
    assert(
        adapterResult !== null &&
        adapter.summary.integration.runCount === 3,
        "Simulation Integration Runtime Adapter 錯誤"
    );
    messages.push("✓ Runtime Adapter 正確");

    assert(
        [
            SimulationIntegrationEvent.STARTED,
            SimulationIntegrationEvent.INPUT_COLLECTED,
            SimulationIntegrationEvent.MODE_SELECTED,
            SimulationIntegrationEvent.PROBABILITY_COMPLETED,
            SimulationIntegrationEvent.EXACT_COMPLETED,
            SimulationIntegrationEvent.MONTE_CARLO_COMPLETED,
            SimulationIntegrationEvent.RESULT_MERGED,
            SimulationIntegrationEvent.COMPLETED
        ].every(type => events.some(event => event.type === type)),
        "Simulation Integration Events 錯誤"
    );
    messages.push("✓ Simulation Integration Events 正確");

    integration.reset();
    assert(
        integration.state === SimulationIntegrationState.IDLE &&
        integration.summary.runCount === 0 &&
        integration.summary.history.count === 0,
        "Simulation Integration Reset 錯誤"
    );

    integration.destroy();
    assert(
        integration.state === SimulationIntegrationState.DESTROYED &&
        integration.summary.destroyed === true,
        "Simulation Integration Destroy 錯誤"
    );
    messages.push("✓ Summary、Reset 與 Destroy 正確");

    return `
${messages.join("\n")}

AI Simulation Integration V9.3 測試完成

Simulation Integration State：通過
Simulation Integration Context：通過
Simulation Input Collector：通過
Probability Gateway：通過
Exact Simulation Gateway：通過
Monte Carlo Simulation Gateway：通過
Simulation Mode Selector：通過
Simulation Result Merger：通過
AI Simulation Integration：通過
Exact Mode：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
