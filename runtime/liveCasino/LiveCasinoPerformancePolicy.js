/**
 * Baccarat Analyzer V10.5.4
 * Path: runtime/liveCasino/LiveCasinoPerformancePolicy.js
 * Purpose: Defines live-casino analysis deadlines and fast/refine profiles.
 */
export const LIVE_CASINO_PERFORMANCE_POLICY_VERSION = "10.4.5";
export const EXACT_OPPORTUNITY_CONFIRMATION_POLICY_VERSION = "10.5.4";

export const LiveCasinoAnalysisProfile = Object.freeze({
    QUICK: "quick",
    FULL: "full"
});

export default class LiveCasinoPerformancePolicy {
    constructor({
        decisionDeadlineMs = 3000,
        quickSimulations = 1200,
        quickBatchSize = 300,
        fullSimulations = 5000,
        fullBatchSize = 500,
        refineDelayMs = 80
    } = {}) {
        if (!Number.isFinite(decisionDeadlineMs) || decisionDeadlineMs < 250) {
            throw new RangeError("decisionDeadlineMs must be >= 250.");
        }

        if (!Number.isFinite(refineDelayMs) || refineDelayMs < 0) {
            throw new RangeError("refineDelayMs must be >= 0.");
        }

        this.decisionDeadlineMs = decisionDeadlineMs;
        this.quickSimulations = quickSimulations;
        this.quickBatchSize = quickBatchSize;
        this.fullSimulations = fullSimulations;
        this.fullBatchSize = fullBatchSize;
        this.refineDelayMs = refineDelayMs;
    }

    getQuickOptions() {
        return {
            mode: "monteCarlo",
            monteCarloOptions: {
                simulations: this.quickSimulations,
                batchSize: this.quickBatchSize
            }
        };
    }

    getFullOptions() {
        return {
            mode: "hybrid",
            monteCarloOptions: {
                simulations: this.fullSimulations,
                batchSize: this.fullBatchSize
            }
        };
    }

    get summary() {
        return {
            version: LIVE_CASINO_PERFORMANCE_POLICY_VERSION,
            exactConfirmationVersion:
                EXACT_OPPORTUNITY_CONFIRMATION_POLICY_VERSION,
            decisionDeadlineMs: this.decisionDeadlineMs,
            quickSimulations: this.quickSimulations,
            quickBatchSize: this.quickBatchSize,
            fullSimulations: this.fullSimulations,
            fullBatchSize: this.fullBatchSize,
            refineDelayMs: this.refineDelayMs
        };
    }
}
