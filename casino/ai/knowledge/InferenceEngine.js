/**
 * Baccarat Analyzer V7.2
 * casino/ai/knowledge/InferenceEngine.js
 */

export const INFERENCE_ENGINE_VERSION = "7.2.0";

export default class InferenceEngine {
    infer({
        knowledge = [],
        patterns = [],
        rules = [],
        minimumConfidence = 0.5
    } = {}) {
        const candidates = [];

        for (
            const record of
            knowledge
        ) {
            if (
                Number.isFinite(
                    record.confidence
                ) &&
                record.confidence >=
                    minimumConfidence
            ) {
                candidates.push({
                    source:
                        "knowledge",

                    key:
                        record.key,

                    value:
                        record.value,

                    confidence:
                        record.confidence,

                    weight:
                        record.weight ??
                        1
                });
            }
        }

        for (
            const pattern of
            patterns
        ) {
            candidates.push({
                source:
                    "pattern",

                key:
                    pattern.name,

                value:
                    pattern.result,

                confidence:
                    Number.isFinite(
                        pattern.result?.confidence
                    )
                        ? pattern.result
                            .confidence
                        : 0.5,

                weight:
                    pattern.weight ??
                    1
            });
        }

        for (
            const rule of
            rules
        ) {
            const result =
                rule.result;

            if (
                result &&
                result.matched !== false
            ) {
                candidates.push({
                    source:
                        "rule",

                    key:
                        rule.rule,

                    value:
                        result.value ??
                        result,

                    confidence:
                        Number.isFinite(
                            result.confidence
                        )
                            ? result.confidence
                            : 0.5,

                    weight:
                        1 +
                        Math.max(
                            0,
                            rule.priority
                        ) /
                        100
                });
            }
        }

        const scoreMap =
            new Map();

        for (
            const candidate of
            candidates
        ) {
            const key =
                JSON.stringify(
                    candidate.value
                );

            const score =
                candidate.confidence *
                candidate.weight;

            scoreMap.set(
                key,
                (
                    scoreMap.get(key) ??
                    0
                ) +
                score
            );
        }

        const ranking =
            [
                ...scoreMap.entries()
            ]
                .map(
                    (
                        [
                            key,
                            score
                        ]
                    ) => ({
                        value:
                            JSON.parse(
                                key
                            ),

                        score
                    })
                )
                .sort(
                    (
                        a,
                        b
                    ) =>
                        b.score -
                        a.score
                );

        return {
            candidates,
            ranking,

            best:
                ranking[0] ??
                null
        };
    }

    get summary() {
        return {
            version:
                INFERENCE_ENGINE_VERSION
        };
    }
}
