/**
 * Baccarat Analyzer V10.3
 * Path: runtime/game/RoundStateCollector.js
 * Purpose: Normalizes engine/round.js and roundResult.js data.
 */
export const ROUND_STATE_COLLECTOR_VERSION = "10.3.0";

function getHandCards(hand) {
    if (!hand) {
        return [];
    }

    if (typeof hand.getCards === "function") {
        return hand.getCards();
    }

    return Array.isArray(hand.cards)
        ? [...hand.cards]
        : [];
}

export default class RoundStateCollector {
    collect(round = null) {
        if (!round) {
            return null;
        }

        const player =
            round.player ??
            round.playerHand ??
            null;

        const banker =
            round.banker ??
            round.bankerHand ??
            null;

        return {
            roundId:
                round.roundId ??
                round.id ??
                null,
            status:
                round.status ??
                null,
            completed:
                Boolean(
                    round.completed ??
                    round.isCompleted
                ),
            player: {
                cards:
                    getHandCards(player),
                value:
                    player?.value ??
                    null,
                isNatural:
                    Boolean(
                        player?.isNatural
                    ),
                isPair:
                    Boolean(
                        player?.isPair
                    )
            },
            banker: {
                cards:
                    getHandCards(banker),
                value:
                    banker?.value ??
                    null,
                isNatural:
                    Boolean(
                        banker?.isNatural
                    ),
                isPair:
                    Boolean(
                        banker?.isPair
                    )
            }
        };
    }

    collectResult(result = null) {
        if (!result) {
            return null;
        }

        return {
            winner:
                result.winner ??
                result.result ??
                null,
            playerValue:
                result.playerValue ??
                result.player?.value ??
                null,
            bankerValue:
                result.bankerValue ??
                result.banker?.value ??
                null,
            playerPair:
                Boolean(
                    result.playerPair ??
                    result.player?.isPair
                ),
            bankerPair:
                Boolean(
                    result.bankerPair ??
                    result.banker?.isPair
                ),
            natural:
                Boolean(
                    result.natural ??
                    result.isNatural
                ),
            raw:
                result
        };
    }

    get summary() {
        return {
            version: ROUND_STATE_COLLECTOR_VERSION
        };
    }
}
