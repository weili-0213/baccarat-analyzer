/**
 * Baccarat Analyzer V7.0
 * casino/ai/TrendPredictor.js
 */

export const TREND_PREDICTOR_VERSION = "7.0.0";

const SIDES = [
    "Player",
    "Banker",
    "Tie"
];

export default class TrendPredictor {
    predict({
        patterns = [],
        statistics = {},
        history = []
    } = {}) {
        const scores = {
            Player: 0,
            Banker: 0,
            Tie: 0
        };

        for (const pattern of patterns) {
            if (
                SIDES.includes(
                    pattern.side
                )
            ) {
                scores[
                    pattern.side
                ] +=
                    Number.isFinite(
                        pattern.strength
                    )
                        ? pattern.strength
                        : 0;
            }
        }

        const winners =
            statistics.winners ??
            {};

        const total =
            SIDES.reduce(
                (
                    sum,
                    side
                ) =>
                    sum +
                    (
                        winners[side] ??
                        0
                    ),
                0
            );

        if (total > 0) {
            for (const side of SIDES) {
                scores[side] +=
                    (
                        winners[side] ??
                        0
                    ) /
                    total;
            }
        }

        const recent =
            Array.isArray(history)
                ? history.slice(-10)
                : [];

        for (
            let index = 0;
            index < recent.length;
            index++
        ) {
            const winner =
                recent[index]?.winner ??
                recent[index]?.result
                    ?.winner ??
                null;

            if (
                SIDES.includes(
                    winner
                )
            ) {
                scores[winner] +=
                    (
                        index + 1
                    ) /
                    (
                        recent.length *
                        10
                    );
            }
        }

        const ordered =
            Object.entries(scores)
                .sort(
                    (
                        a,
                        b
                    ) =>
                        b[1] -
                        a[1]
                );

        const best =
            ordered[0];

        const second =
            ordered[1];

        const spread =
            Math.max(
                0,
                best[1] -
                    second[1]
            );

        return {
            trend:
                best[0],

            strength:
                Math.min(
                    1,
                    best[1] / 3
                ),

            confidence:
                Math.min(
                    1,
                    spread
                ),

            scores
        };
    }

    get summary() {
        return {
            version:
                TREND_PREDICTOR_VERSION
        };
    }
}
