/**
 * Baccarat Analyzer V9.4
 * Path: integration/prediction/PredictionIntegrationContext.js
 * Purpose: Carries simulation, roadmap, statistics and historical inputs.
 */

export const PREDICTION_INTEGRATION_CONTEXT_VERSION = "9.4.0";

export default class PredictionIntegrationContext {
    constructor({
        simulation = null,
        statistics = null,
        roadmap = null,
        history = [],
        recentOutcomes = [],
        settings = null,
        metadata = {}
    } = {}) {
        this.version = PREDICTION_INTEGRATION_CONTEXT_VERSION;
        this.simulation = simulation;
        this.statistics = statistics;
        this.roadmap = roadmap;
        this.history = [...history];
        this.recentOutcomes = [...recentOutcomes];
        this.settings = settings;
        this.metadata = { ...metadata };
    }

    merge(data = {}) {
        for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value)) {
                this[key] = [...value];
            } else if (
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

    toJSON() {
        return {
            version: this.version,
            simulation: this.simulation,
            statistics: this.statistics,
            roadmap: this.roadmap,
            history: [...this.history],
            recentOutcomes: [...this.recentOutcomes],
            settings: this.settings,
            metadata: { ...this.metadata }
        };
    }
}
