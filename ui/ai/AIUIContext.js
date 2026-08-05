/**
 * Baccarat Analyzer V9.1
 * ui/ai/AIUIContext.js
 */
export const AI_UI_CONTEXT_VERSION = "9.1.0";

export default class AIUIContext {
    constructor({
        session = null,
        shoe = null,
        round = null,
        statistics = null,
        roadmap = null,
        bankroll = null,
        settings = null,
        metadata = {}
    } = {}) {
        this.version = AI_UI_CONTEXT_VERSION;
        this.session = session;
        this.shoe = shoe;
        this.round = round;
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
            metadata: { ...this.metadata }
        };
    }
}
