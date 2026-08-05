/**
 * Baccarat Analyzer V9.3
 * Path: integration/simulation/AISimulationIntegration.js
 * Purpose: Coordinates Probability, Exact and Monte Carlo simulation workflows.
 */
import { SimulationIntegrationState, SimulationMode } from "./SimulationIntegrationState.js";
import SimulationIntegrationContext from "./SimulationIntegrationContext.js";
import SimulationInputCollector from "./SimulationInputCollector.js";
import SimulationModeSelector from "./SimulationModeSelector.js";
import SimulationResultMerger from "./SimulationResultMerger.js";
import SimulationIntegrationHistory from "./SimulationIntegrationHistory.js";

export const AI_SIMULATION_INTEGRATION_VERSION = "9.3.0";

export const SimulationIntegrationEvent = Object.freeze({
    STATE_CHANGE: "ai-simulation-integration:state-change",
    STARTED: "ai-simulation-integration:started",
    INPUT_COLLECTED: "ai-simulation-integration:input-collected",
    MODE_SELECTED: "ai-simulation-integration:mode-selected",
    PROBABILITY_COMPLETED: "ai-simulation-integration:probability-completed",
    EXACT_COMPLETED: "ai-simulation-integration:exact-completed",
    MONTE_CARLO_COMPLETED: "ai-simulation-integration:monte-carlo-completed",
    RESULT_MERGED: "ai-simulation-integration:result-merged",
    COMPLETED: "ai-simulation-integration:completed",
    PAUSED: "ai-simulation-integration:paused",
    RESUMED: "ai-simulation-integration:resumed",
    ERROR: "ai-simulation-integration:error",
    DESTROYED: "ai-simulation-integration:destroyed"
});

const isFunction = value => typeof value === "function";

export default class AISimulationIntegration {
    constructor({
        collector = null,
        selector = null,
        probabilityGateway,
        exactGateway,
        monteCarloGateway,
        merger = null,
        history = null,
        eventBus = null,
        clock = () => Date.now()
    } = {}) {
        if (!probabilityGateway || !isFunction(probabilityGateway.calculate)) {
            throw new TypeError("AISimulationIntegration requires probabilityGateway.calculate().");
        }
        if (!exactGateway || !isFunction(exactGateway.simulate)) {
            throw new TypeError("AISimulationIntegration requires exactGateway.simulate().");
        }
        if (!monteCarloGateway || !isFunction(monteCarloGateway.simulate)) {
            throw new TypeError("AISimulationIntegration requires monteCarloGateway.simulate().");
        }
        if (eventBus !== null && !isFunction(eventBus.emit)) {
            throw new TypeError("eventBus requires emit().");
        }
        if (!isFunction(clock)) {
            throw new TypeError("clock must be a function.");
        }

        this.collector = collector ?? new SimulationInputCollector();
        this.selector = selector ?? new SimulationModeSelector();
        this.probabilityGateway = probabilityGateway;
        this.exactGateway = exactGateway;
        this.monteCarloGateway = monteCarloGateway;
        this.merger = merger ?? new SimulationResultMerger();
        this.history = history ?? new SimulationIntegrationHistory();
        this.eventBus = eventBus;
        this.clock = clock;

        this.state = SimulationIntegrationState.IDLE;
        this.previousState = null;
        this.paused = false;
        this.destroyed = false;
        this.sequence = 0;
        this.runCount = 0;
        this.lastResult = null;
        this.lastError = null;
    }

    emit(type, payload = null) {
        return this.eventBus?.emit(type, payload, { source: "ai-simulation-integration" }) ?? null;
    }

    setState(state) {
        const previous = this.state;
        this.previousState = previous;
        this.state = state;
        this.emit(SimulationIntegrationEvent.STATE_CHANGE, { previous, current: state });
        return this;
    }

    assertNotDestroyed() {
        if (this.destroyed) {
            throw new Error("AISimulationIntegration has been destroyed.");
        }
    }

    async run({ context = {} } = {}) {
        this.assertNotDestroyed();
        if (this.paused) return null;

        const simulationContext = context instanceof SimulationIntegrationContext
            ? context
            : new SimulationIntegrationContext(context);

        this.sequence += 1;
        const integrationId = `simulation-integration-${this.clock()}-${this.sequence}`;
        this.setState(SimulationIntegrationState.COLLECTING);
        this.emit(SimulationIntegrationEvent.STARTED, { integrationId, context: simulationContext });

        try {
            const input = this.collector.collect(simulationContext);
            this.emit(SimulationIntegrationEvent.INPUT_COLLECTED, input);

            const remainingCount = input.remainingCards?.length ?? input.shoe?.remaining ?? null;
            const mode = this.selector.select({
                requestedMode: input.mode,
                remainingCount,
                exactThreshold: input.settings?.exactThreshold ?? 80
            });
            this.emit(SimulationIntegrationEvent.MODE_SELECTED, mode);

            this.setState(SimulationIntegrationState.PROBABILITY);
            const probability = await this.probabilityGateway.calculate(input);
            this.emit(SimulationIntegrationEvent.PROBABILITY_COMPLETED, probability);

            let exact = null;
            let monteCarlo = null;

            if (mode === SimulationMode.EXACT || mode === SimulationMode.HYBRID) {
                this.setState(SimulationIntegrationState.EXACT);
                exact = await this.exactGateway.simulate(input);
                this.emit(SimulationIntegrationEvent.EXACT_COMPLETED, exact);
            }

            if (mode === SimulationMode.MONTE_CARLO || mode === SimulationMode.HYBRID) {
                this.setState(SimulationIntegrationState.MONTE_CARLO);
                monteCarlo = await this.monteCarloGateway.simulate({ ...input, iterations: input.iterations });
                this.emit(SimulationIntegrationEvent.MONTE_CARLO_COMPLETED, monteCarlo);
            }

            this.setState(SimulationIntegrationState.MERGING);
            const merged = this.merger.merge({ probability, exact, monteCarlo, mode });
            this.emit(SimulationIntegrationEvent.RESULT_MERGED, merged);

            const result = {
                version: AI_SIMULATION_INTEGRATION_VERSION,
                integrationId,
                input,
                mode,
                probability,
                exact,
                monteCarlo,
                merged,
                createdAt: this.clock()
            };

            this.lastResult = result;
            this.runCount += 1;
            this.history.add(result);
            this.setState(SimulationIntegrationState.COMPLETED);
            this.emit(SimulationIntegrationEvent.COMPLETED, result);
            return result;
        } catch (error) {
            return this.handleError(error, "run");
        }
    }

    pause() {
        this.assertNotDestroyed();
        this.paused = true;
        this.setState(SimulationIntegrationState.PAUSED);
        this.emit(SimulationIntegrationEvent.PAUSED, this.summary);
        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();
        this.paused = false;
        this.setState(SimulationIntegrationState.IDLE);
        this.emit(SimulationIntegrationEvent.RESUMED, this.summary);
        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();
        this.history.clear();
        this.runCount = 0;
        this.lastResult = null;
        this.lastError = null;
        this.paused = false;
        this.setState(SimulationIntegrationState.IDLE);
        return this;
    }

    handleError(error, phase) {
        this.lastError = error;
        this.setState(SimulationIntegrationState.ERROR);
        this.emit(SimulationIntegrationEvent.ERROR, { phase, message: error?.message ?? String(error) });
        throw error;
    }

    destroy() {
        if (this.destroyed) return this;
        this.history.clear();
        this.lastResult = null;
        this.lastError = null;
        this.destroyed = true;
        this.setState(SimulationIntegrationState.DESTROYED);
        this.emit(SimulationIntegrationEvent.DESTROYED, null);
        return this;
    }

    get summary() {
        return {
            version: AI_SIMULATION_INTEGRATION_VERSION,
            state: this.state,
            previousState: this.previousState,
            paused: this.paused,
            destroyed: this.destroyed,
            runCount: this.runCount,
            hasResult: Boolean(this.lastResult),
            lastError: this.lastError?.message ?? null,
            collector: this.collector.summary,
            selector: this.selector.summary,
            probabilityGateway: this.probabilityGateway.summary,
            exactGateway: this.exactGateway.summary,
            monteCarloGateway: this.monteCarloGateway.summary,
            merger: this.merger.summary,
            history: this.history.summary
        };
    }
}
