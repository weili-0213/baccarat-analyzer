/**
 * Baccarat Analyzer V10.3
 * Path: runtime/game/GameAnalysisInputBuilder.js
 * Purpose: Builds V10.2 Live Runtime observation input from real Baccarat game state.
 */
export const GAME_ANALYSIS_INPUT_BUILDER_VERSION = "10.3.0";

export default class GameAnalysisInputBuilder {
    build({
        shoeId = null,
        roundId = null,
        roundNumber = 0,
        shoeState,
        roundState = null,
        statistics = null,
        roadmap = null,
        bankroll = null,
        settings = null,
        metadata = {}
    } = {}) {
        if (!shoeState) {
            throw new TypeError(
                "GameAnalysisInputBuilder requires shoeState."
            );
        }

        return {
            observation: {
                round: {
                    roundId,
                    roundNumber,
                    state:
                        roundState
                },
                shoe: {
                    shoeId,
                    deckCount:
                        shoeState.deckCount,
                    total:
                        shoeState.total,
                    remaining:
                        shoeState.remaining,
                    used:
                        shoeState.used,
                    remainingRatio:
                        shoeState.remainingRatio,
                    burned:
                        shoeState.burned
                },
                remainingCards:
                    shoeState.remainingCards,
                statistics,
                roadmap,
                bankroll,
                settings,
                metadata: {
                    source:
                        "game-runtime",
                    ...metadata
                }
            },
            statistics,
            roadmap,
            bankroll,
            settings,
            metadata: {
                source:
                    "game-runtime",
                ...metadata
            }
        };
    }

    get summary() {
        return {
            version: GAME_ANALYSIS_INPUT_BUILDER_VERSION
        };
    }
}
