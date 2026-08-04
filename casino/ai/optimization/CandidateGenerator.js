/**
 * Baccarat Analyzer V7.9
 * casino/ai/optimization/CandidateGenerator.js
 */

export const CANDIDATE_GENERATOR_VERSION = "7.9.0";

function clamp(value, min, max) {
    let next = value;

    if (Number.isFinite(min)) {
        next = Math.max(min, next);
    }

    if (Number.isFinite(max)) {
        next = Math.min(max, next);
    }

    return next;
}

export default class CandidateGenerator {
    generate(parameterSpace) {
        const baseline = parameterSpace.current();
        const candidates = [
            {
                candidateId: "baseline",
                parameters: { ...baseline },
                source: "baseline"
            }
        ];

        for (const definition of parameterSpace.parameters.values()) {
            if (Array.isArray(definition.values)) {
                for (const value of definition.values) {
                    if (value === definition.current) {
                        continue;
                    }

                    candidates.push({
                        candidateId:
                            `${definition.name}-${String(value)}`,
                        parameters: {
                            ...baseline,
                            [definition.name]:
                                value
                        },
                        source:
                            definition.name
                    });
                }

                continue;
            }

            if (
                Number.isFinite(definition.current) &&
                Number.isFinite(definition.step) &&
                definition.step > 0
            ) {
                const lower =
                    clamp(
                        definition.current -
                            definition.step,
                        definition.min,
                        definition.max
                    );

                const upper =
                    clamp(
                        definition.current +
                            definition.step,
                        definition.min,
                        definition.max
                    );

                if (lower !== definition.current) {
                    candidates.push({
                        candidateId:
                            `${definition.name}-lower`,
                        parameters: {
                            ...baseline,
                            [definition.name]:
                                lower
                        },
                        source:
                            definition.name
                    });
                }

                if (upper !== definition.current) {
                    candidates.push({
                        candidateId:
                            `${definition.name}-upper`,
                        parameters: {
                            ...baseline,
                            [definition.name]:
                                upper
                        },
                        source:
                            definition.name
                    });
                }
            }
        }

        return candidates;
    }

    get summary() {
        return {
            version: CANDIDATE_GENERATOR_VERSION
        };
    }
}
