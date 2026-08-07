/**
 * Baccarat Analyzer V10.3
 * Path: runtime/game/ShoeStateCollector.js
 * Purpose: Converts engine/shoe.js state into a stable AI observation.
 */
export const SHOE_STATE_COLLECTOR_VERSION = "10.3.0";

export default class ShoeStateCollector {
    collect(shoe) {
        if (!shoe) {
            throw new TypeError(
                "ShoeStateCollector requires shoe."
            );
        }

        const remainingCards =
            typeof shoe.peek === "function"
                ? shoe.peek()
                : Array.isArray(shoe.cards)
                    ? [...shoe.cards]
                    : [];

        const history =
            Array.isArray(shoe.history)
                ? [...shoe.history]
                : Array.isArray(shoe.discarded)
                    ? [...shoe.discarded]
                    : [];

        const burned =
            Array.isArray(shoe.burned)
                ? [...shoe.burned]
                : [];

        const deckCount =
            shoe.deckCount ??
            8;

        const total =
            Number.isFinite(shoe.total)
                ? shoe.total
                : deckCount * 52;

        const remaining =
            Number.isFinite(shoe.remaining)
                ? shoe.remaining
                : remainingCards.length;

        const used =
            Number.isFinite(shoe.used)
                ? shoe.used
                : history.length;

        const remainingRatio =
            Number.isFinite(shoe.remainingRatio)
                ? shoe.remainingRatio
                : total > 0
                    ? remaining / total
                    : 0;

        return {
            deckCount,
            total,
            remaining,
            used,
            remainingRatio,
            remainingCards,
            history,
            burned
        };
    }

    get summary() {
        return {
            version: SHOE_STATE_COLLECTOR_VERSION
        };
    }
}
