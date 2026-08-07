/**
 * Baccarat Analyzer V10.3
 * Path: runtime/game/GameRuntimeContext.js
 * Purpose: Carries Baccarat game, shoe, round and AI runtime data.
 */
export const GAME_RUNTIME_CONTEXT_VERSION = "10.3.0";

export default class GameRuntimeContext {
    constructor({
        shoeId = null,
        roundId = null,
        roundNumber = 0,
        gameState = null,
        shoeState = null,
        roundState = null,
        roundResult = null,
        analysisInput = null,
        analysisResult = null,
        settlementResult = null,
        statistics = null,
        roadmap = null,
        bankroll = null,
        settings = null,
        metadata = {}
    } = {}) {
        this.version = GAME_RUNTIME_CONTEXT_VERSION;
        this.shoeId = shoeId;
        this.roundId = roundId;
        this.roundNumber = roundNumber;
        this.gameState = gameState;
        this.shoeState = shoeState;
        this.roundState = roundState;
        this.roundResult = roundResult;
        this.analysisInput = analysisInput;
        this.analysisResult = analysisResult;
        this.settlementResult = settlementResult;
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
            shoeId: this.shoeId,
            roundId: this.roundId,
            roundNumber: this.roundNumber,
            gameState: this.gameState,
            shoeState: this.shoeState,
            roundState: this.roundState,
            roundResult: this.roundResult,
            analysisInput: this.analysisInput,
            analysisResult: this.analysisResult,
            settlementResult: this.settlementResult,
            statistics: this.statistics,
            roadmap: this.roadmap,
            bankroll: this.bankroll,
            settings: this.settings,
            metadata: { ...this.metadata }
        };
    }
}
