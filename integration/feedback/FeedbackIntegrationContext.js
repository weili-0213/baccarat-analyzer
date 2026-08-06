/**
 * Baccarat Analyzer V9.9
 * Path: integration/feedback/FeedbackIntegrationContext.js
 * Purpose: Carries execution, outcome, learning and subsystem feedback inputs.
 */
export const FEEDBACK_INTEGRATION_CONTEXT_VERSION = "9.9.0";

export default class FeedbackIntegrationContext {
    constructor({
        execution = null,
        actualOutcome = null,
        learning = null,
        adaptive = null,
        strategy = null,
        prediction = null,
        decision = null,
        simulation = null,
        statistics = null,
        bankroll = null,
        settings = null,
        metadata = {}
    } = {}) {
        this.version = FEEDBACK_INTEGRATION_CONTEXT_VERSION;
        this.execution = execution;
        this.actualOutcome = actualOutcome;
        this.learning = learning;
        this.adaptive = adaptive;
        this.strategy = strategy;
        this.prediction = prediction;
        this.decision = decision;
        this.simulation = simulation;
        this.statistics = statistics;
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
                this[key] = { ...this[key], ...value };
            } else {
                this[key] = value;
            }
        }

        return this;
    }

    toJSON() {
        return {
            version: this.version,
            execution: this.execution,
            actualOutcome: this.actualOutcome,
            learning: this.learning,
            adaptive: this.adaptive,
            strategy: this.strategy,
            prediction: this.prediction,
            decision: this.decision,
            simulation: this.simulation,
            statistics: this.statistics,
            bankroll: this.bankroll,
            settings: this.settings,
            metadata: { ...this.metadata }
        };
    }
}
