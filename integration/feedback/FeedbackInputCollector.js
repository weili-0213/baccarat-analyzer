/**
 * Baccarat Analyzer V9.9
 * Path: integration/feedback/FeedbackInputCollector.js
 * Purpose: Normalizes execution and outcome data into feedback input.
 */
export const FEEDBACK_INPUT_COLLECTOR_VERSION = "9.9.0";

export default class FeedbackInputCollector {
    collect(context = {}) {
        return {
            execution: context.execution ?? null,
            actualOutcome: context.actualOutcome ?? null,
            learning: context.learning ?? null,
            adaptive: context.adaptive ?? null,
            strategy: context.strategy ?? null,
            prediction: context.prediction ?? null,
            decision: context.decision ?? null,
            simulation: context.simulation ?? null,
            statistics: context.statistics ?? null,
            bankroll: context.bankroll ?? null,
            settings: context.settings ?? null,
            metadata: { ...(context.metadata ?? {}) }
        };
    }

    get summary() {
        return {
            version: FEEDBACK_INPUT_COLLECTOR_VERSION
        };
    }
}
