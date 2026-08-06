/**
 * Baccarat Analyzer V10.0
 * Path: integration/closedloop/ClosedLoopContext.js
 * Purpose: Carries all inputs and intermediate outputs through the closed-loop pipeline.
 */
export const CLOSED_LOOP_CONTEXT_VERSION = "10.0.0";

export default class ClosedLoopContext {
    constructor({
        observation = null,
        simulation = null,
        prediction = null,
        decision = null,
        strategy = null,
        execution = null,
        feedback = null,
        learning = null,
        adaptive = null,
        actualOutcome = null,
        statistics = null,
        roadmap = null,
        bankroll = null,
        settings = null,
        metadata = {}
    } = {}) {
        this.version = CLOSED_LOOP_CONTEXT_VERSION;
        this.observation = observation;
        this.simulation = simulation;
        this.prediction = prediction;
        this.decision = decision;
        this.strategy = strategy;
        this.execution = execution;
        this.feedback = feedback;
        this.learning = learning;
        this.adaptive = adaptive;
        this.actualOutcome = actualOutcome;
        this.statistics = statistics;
        this.roadmap = roadmap;
        this.bankroll = bankroll;
        this.settings = settings;
        this.metadata = { ...metadata };
    }

    merge(data = {}) {
        for (const [key, value] of Object.entries(data)) {
            if (
                value &&
                typeof value === "object" &&
                !Array.isArray(value) &&
                this[key] &&
                typeof this[key] === "object" &&
                !Array.isArray(this[key])
            ) {
                this[key] = {
                    ...this[key],
                    ...value
                };
            } else {
                this[key] = value;
            }
        }

        return this;
    }

    snapshot() {
        return {
            version: this.version,
            observation: this.observation,
            simulation: this.simulation,
            prediction: this.prediction,
            decision: this.decision,
            strategy: this.strategy,
            execution: this.execution,
            feedback: this.feedback,
            learning: this.learning,
            adaptive: this.adaptive,
            actualOutcome: this.actualOutcome,
            statistics: this.statistics,
            roadmap: this.roadmap,
            bankroll: this.bankroll,
            settings: this.settings,
            metadata: { ...this.metadata }
        };
    }
}
