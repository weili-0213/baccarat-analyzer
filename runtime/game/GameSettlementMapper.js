/**
 * Baccarat Analyzer V10.3
 * Path: runtime/game/GameSettlementMapper.js
 * Purpose: Maps a real RoundResult into V10.2 Live Runtime settlement input.
 */
export const GAME_SETTLEMENT_MAPPER_VERSION = "10.3.0";

export default class GameSettlementMapper {
    map({
        roundResult,
        profit = 0,
        payout = 0,
        stake = 0,
        metadata = {}
    } = {}) {
        if (!roundResult) {
            throw new TypeError(
                "GameSettlementMapper requires roundResult."
            );
        }

        const winner =
            roundResult.winner ??
            roundResult.result ??
            null;

        if (
            winner !== "Player" &&
            winner !== "Banker" &&
            winner !== "Tie"
        ) {
            throw new TypeError(
                "RoundResult winner must be Player, Banker or Tie."
            );
        }

        return {
            winner,
            profit:
                Number.isFinite(profit)
                    ? profit
                    : 0,
            payout:
                Number.isFinite(payout)
                    ? payout
                    : 0,
            stake:
                Number.isFinite(stake)
                    ? stake
                    : 0,
            metadata: {
                playerValue:
                    roundResult.playerValue ??
                    roundResult.player?.value ??
                    null,
                bankerValue:
                    roundResult.bankerValue ??
                    roundResult.banker?.value ??
                    null,
                playerPair:
                    Boolean(
                        roundResult.playerPair ??
                        roundResult.player?.isPair
                    ),
                bankerPair:
                    Boolean(
                        roundResult.bankerPair ??
                        roundResult.banker?.isPair
                    ),
                ...metadata
            }
        };
    }

    get summary() {
        return {
            version: GAME_SETTLEMENT_MAPPER_VERSION
        };
    }
}
