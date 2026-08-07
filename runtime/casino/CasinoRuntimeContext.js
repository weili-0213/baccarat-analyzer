/**
 * Baccarat Analyzer V10.4
 * Path: runtime/casino/CasinoRuntimeContext.js
 * Purpose: Stores the unified Casino Runtime context.
 */
export const CASINO_RUNTIME_CONTEXT_VERSION = "10.4.0";

export default class CasinoRuntimeContext {
    constructor({
        casinoSessionId = null,
        shoeId = null,
        roundId = null,
        roundNumber = 0,
        session = null,
        game = null,
        analysis = null,
        settlement = null,
        bet = null,
        dashboard = null,
        metadata = {}
    } = {}) {
        this.version = CASINO_RUNTIME_CONTEXT_VERSION;
        this.casinoSessionId = casinoSessionId;
        this.shoeId = shoeId;
        this.roundId = roundId;
        this.roundNumber = roundNumber;
        this.session = session;
        this.game = game;
        this.analysis = analysis;
        this.settlement = settlement;
        this.bet = bet;
        this.dashboard = dashboard;
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
            casinoSessionId: this.casinoSessionId,
            shoeId: this.shoeId,
            roundId: this.roundId,
            roundNumber: this.roundNumber,
            session: this.session,
            game: this.game,
            analysis: this.analysis,
            settlement: this.settlement,
            bet: this.bet,
            dashboard: this.dashboard,
            metadata: { ...this.metadata }
        };
    }
}
