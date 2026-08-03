/**
 * Baccarat Analyzer V7.0
 * casino/ai/PatternRecognizer.js
 */

export const PATTERN_RECOGNIZER_VERSION = "7.0.0";

function getWinner(record) {
    return (
        record?.winner ??
        record?.result?.winner ??
        null
    );
}

function normalizeHistory(history) {
    return Array.isArray(history)
        ? history
            .map(getWinner)
            .filter(Boolean)
        : [];
}

export default class PatternRecognizer {
    recognize({
        history = [],
        roadmap = {},
        statistics = {}
    } = {}) {
        const winners =
            normalizeHistory(history);

        const patterns = [];

        const streak =
            this.detectStreak(
                winners,
                statistics
            );

        if (streak) {
            patterns.push(streak);
        }

        const chop =
            this.detectChop(
                winners
            );

        if (chop) {
            patterns.push(chop);
        }

        const dragon =
            this.detectDragon(
                winners
            );

        if (dragon) {
            patterns.push(dragon);
        }

        const pingPong =
            this.detectPingPong(
                winners
            );

        if (pingPong) {
            patterns.push(pingPong);
        }

        const roadPattern =
            this.detectRoadPattern(
                roadmap
            );

        if (roadPattern) {
            patterns.push(
                roadPattern
            );
        }

        return patterns;
    }

    detectStreak(
        winners,
        statistics
    ) {
        const explicit =
            statistics.currentStreak ??
            statistics.streak ??
            null;

        if (
            explicit &&
            Number.isFinite(
                explicit.length
            ) &&
            explicit.length >= 3
        ) {
            return {
                type:
                    "streak",

                side:
                    explicit.side ??
                    explicit.winner ??
                    null,

                length:
                    explicit.length,

                strength:
                    Math.min(
                        1,
                        explicit.length / 8
                    )
            };
        }

        if (winners.length < 3) {
            return null;
        }

        const side =
            winners[
                winners.length - 1
            ];

        let length = 1;

        for (
            let index =
                winners.length - 2;
            index >= 0;
            index--
        ) {
            if (
                winners[index] !== side
            ) {
                break;
            }

            length++;
        }

        if (length < 3) {
            return null;
        }

        return {
            type:
                "streak",

            side,

            length,

            strength:
                Math.min(
                    1,
                    length / 8
                )
        };
    }

    detectChop(winners) {
        if (winners.length < 4) {
            return null;
        }

        const recent =
            winners.slice(-6);

        const alternating =
            recent.every(
                (
                    winner,
                    index
                ) =>
                    index === 0 ||
                    winner !==
                        recent[
                            index - 1
                        ]
            );

        if (!alternating) {
            return null;
        }

        const last =
            recent[
                recent.length - 1
            ];

        return {
            type:
                "chop",

            side:
                last === "Player"
                    ? "Banker"
                    : "Player",

            length:
                recent.length,

            strength:
                Math.min(
                    1,
                    recent.length / 8
                )
        };
    }

    detectDragon(winners) {
        if (winners.length < 5) {
            return null;
        }

        const recent =
            winners.slice(-8);

        const playerCount =
            recent.filter(
                winner =>
                    winner === "Player"
            ).length;

        const bankerCount =
            recent.filter(
                winner =>
                    winner === "Banker"
            ).length;

        const side =
            playerCount >
                bankerCount
                ? "Player"
                : "Banker";

        const dominant =
            Math.max(
                playerCount,
                bankerCount
            );

        if (dominant < 5) {
            return null;
        }

        return {
            type:
                "dragon",

            side,

            length:
                dominant,

            strength:
                Math.min(
                    1,
                    dominant / 8
                )
        };
    }

    detectPingPong(winners) {
        if (winners.length < 6) {
            return null;
        }

        const recent =
            winners.slice(-6);

        const pairs = [];

        for (
            let index = 0;
            index < recent.length;
            index += 2
        ) {
            pairs.push(
                recent.slice(
                    index,
                    index + 2
                )
            );
        }

        const valid =
            pairs.every(
                pair =>
                    pair.length === 2 &&
                    pair[0] === pair[1]
            ) &&
            pairs.every(
                (
                    pair,
                    index
                ) =>
                    index === 0 ||
                    pair[0] !==
                        pairs[
                            index - 1
                        ][0]
            );

        if (!valid) {
            return null;
        }

        return {
            type:
                "ping-pong",

            side:
                pairs[
                    pairs.length - 1
                ][0] === "Player"
                    ? "Banker"
                    : "Player",

            length:
                recent.length,

            strength:
                0.7
        };
    }

    detectRoadPattern(
        roadmap
    ) {
        const bigRoad =
            roadmap.bigRoad ??
            roadmap.bigRoadData ??
            null;

        if (
            !Array.isArray(bigRoad) ||
            bigRoad.length < 3
        ) {
            return null;
        }

        const latest =
            bigRoad[
                bigRoad.length - 1
            ];

        const side =
            typeof latest === "string"
                ? latest
                : latest?.winner ??
                    latest?.side ??
                    null;

        if (!side) {
            return null;
        }

        return {
            type:
                "road-pattern",

            side,

            length:
                bigRoad.length,

            strength:
                0.55
        };
    }

    get summary() {
        return {
            version:
                PATTERN_RECOGNIZER_VERSION
        };
    }
}
