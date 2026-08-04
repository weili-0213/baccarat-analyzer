/**
 * Baccarat Analyzer V7.6
 * casino/ai/collaboration/ConsensusEngine.js
 */

export const CONSENSUS_ENGINE_VERSION = "7.6.0";

export default class ConsensusEngine {
    resolve(votes = []) {
        const totals = new Map();

        for (const vote of votes) {
            const key =
                JSON.stringify(
                    vote.value
                );

            const weight =
                Number.isFinite(
                    vote.weight
                )
                    ? vote.weight
                    : 1;

            const confidence =
                Number.isFinite(
                    vote.confidence
                )
                    ? vote.confidence
                    : 1;

            const score =
                weight *
                confidence;

            totals.set(
                key,
                (
                    totals.get(key) ??
                    0
                ) +
                score
            );
        }

        const ranking = [
            ...totals.entries()
        ]
            .map(
                ([key, score]) => ({
                    value:
                        JSON.parse(key),
                    score
                })
            )
            .sort(
                (a, b) =>
                    b.score - a.score
            );

        return {
            voteCount: votes.length,
            ranking,
            consensus:
                ranking[0] ??
                null
        };
    }

    get summary() {
        return {
            version: CONSENSUS_ENGINE_VERSION
        };
    }
}
