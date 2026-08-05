/**
 * Baccarat Analyzer V9.0
 * casino/ai/os/AIOperatingContext.js
 */
export const AI_OPERATING_CONTEXT_VERSION = "9.0.0";

export default class AIOperatingContext {
    constructor({
        session = null,
        shoe = null,
        round = null,
        statistics = null,
        roadmap = null,
        bankroll = null,
        settings = null,
        globalState = {},
        metadata = {}
    } = {}) {
        this.version = AI_OPERATING_CONTEXT_VERSION;
        this.session = session;
        this.shoe = shoe;
        this.round = round;
        this.statistics = statistics;
        this.roadmap = roadmap;
        this.bankroll = bankroll;
        this.settings = settings;
        this.globalState = { ...globalState };
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
            session: this.session,
            shoe: this.shoe,
            round: this.round,
            statistics: this.statistics,
            roadmap: this.roadmap,
            bankroll: this.bankroll,
            settings: this.settings,
            globalState: { ...this.globalState },
            metadata: { ...this.metadata }
        };
    }
}
