/**
 * Baccarat Analyzer V8.3
 * casino/ai/collective/DeliberationEngine.js
 */

export const DELIBERATION_ENGINE_VERSION = "8.3.0";

export default class DeliberationEngine {
    deliberate(contributions = []) {
        const groups = new Map();

        for (const contribution of contributions) {
            const key =
                JSON.stringify(
                    contribution.opinion
                );

            const score =
                contribution.weight *
                contribution.confidence;

            if (!groups.has(key)) {
                groups.set(key, {
                    opinion:
                        contribution.opinion,
                    score:
                        0,
                    supporters:
                        [],
                    evidence:
                        []
                });
            }

            const group =
                groups.get(key);

            group.score += score;
            group.supporters.push(
                contribution.agentId
            );
            group.evidence.push(
                ...contribution.evidence
            );
        }

        const ranking =
            [...groups.values()]
                .sort(
                    (a, b) =>
                        b.score - a.score
                );

        return {
            ranking,
            leading:
                ranking[0] ??
                null,
            contributionCount:
                contributions.length
        };
    }

    get summary() {
        return {
            version:
                DELIBERATION_ENGINE_VERSION
        };
    }
}
