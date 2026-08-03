/**
 * Baccarat Analyzer V3.5
 * analysis/pipeline/ProbabilityPipeline.js
 *
 * 第一批 Analyzer Pipeline：
 * - 接收已提供 probability
 * - 或呼叫 resolveAnalysis() 取得 Monte Carlo / Exact 結果
 * - 驗證主注機率
 * - 將 probability / method / monteCarlo / exact 寫入共享 state
 */

export const PROBABILITY_PIPELINE_VERSION =
    "3.5.0";


const REQUIRED_MAIN_KEYS =
    Object.freeze([

        "player",

        "banker",

        "tie"

    ]);


function isObject(value) {

    return (
        value !== null &&
        typeof value ===
            "object" &&
        !Array.isArray(value)
    );

}


function validateProbabilityValue(
    value,
    name
) {

    if (
        !Number.isFinite(
            value
        ) ||
        value < 0 ||
        value > 1
    ) {

        throw new RangeError(
            `${name} probability must be between 0 and 1.`
        );

    }

}


export default class ProbabilityPipeline {

    constructor({

        normalizeProbability = null,

        resolveAnalysis = null,

        supportedKeys = null

    } = {}) {

        this.normalizeProbability =
            normalizeProbability;

        this.resolveAnalysis =
            resolveAnalysis;

        this.supportedKeys =
            Array.isArray(
                supportedKeys
            )
                ? [
                    ...supportedKeys
                ]
                : null;

    }


    extractProbability(source) {

        if (!isObject(source)) {

            return null;

        }


        if (
            isObject(
                source.probability
            )
        ) {

            return source.probability;

        }


        return source;

    }


    normalize(source) {

        if (
            typeof this
                .normalizeProbability ===
                "function"
        ) {

            return this
                .normalizeProbability(
                    source
                );

        }


        const input =
            this.extractProbability(
                source
            );


        if (!input) {

            throw new Error(
                "Probability data is required."
            );

        }


        const keys =
            this.supportedKeys ??
            Object.keys(
                input
            );

        const result =
            {};


        for (
            const name of
            keys
        ) {

            const value =
                input[name];


            if (
                value ===
                    undefined ||
                value ===
                    null
            ) {

                continue;

            }


            validateProbabilityValue(
                value,
                name
            );

            result[name] =
                value;

        }


        for (
            const name of
            REQUIRED_MAIN_KEYS
        ) {

            if (
                !Number.isFinite(
                    result[name]
                )
            ) {

                throw new Error(
                    `Missing required probability: ${name}`
                );

            }

        }


        const total =

            result.player +
            result.banker +
            result.tie;


        if (
            Math.abs(
                total -
                1
            ) > 0.001
        ) {

            throw new RangeError(
                "Player, Banker and Tie probabilities must total approximately 1."
            );

        }


        return result;

    }


    async run({

        state,
        signal

    }) {

        const runOptions =
            isObject(
                state.runOptions
            )
                ? state.runOptions
                : {};


        if (
            runOptions.probability
        ) {

            return {

                probability:
                    this.normalize(
                        runOptions
                            .probability
                    ),

                method:
                    "provided",

                monteCarlo:
                    runOptions
                        .monteCarloResult ??
                    null,

                exact:
                    runOptions
                        .exactResult ??
                    null

            };

        }


        if (
            typeof this
                .resolveAnalysis !==
                "function"
        ) {

            throw new Error(
                "ProbabilityPipeline requires probability or resolveAnalysis()."
            );

        }


        const resolved =
            await this
                .resolveAnalysis({

                    mode:
                        runOptions.mode,

                    probability:
                        runOptions
                            .probability ??
                        null,

                    monteCarloResult:
                        runOptions
                            .monteCarloResult ??
                        null,

                    exactResult:
                        runOptions
                            .exactResult ??
                        null,

                    monteCarloOptions:
                        runOptions
                            .monteCarloOptions ??
                        {},

                    exactOptions:
                        runOptions
                            .exactOptions ??
                        {},

                    signal,

                    onMonteCarloProgress:
                        runOptions
                            .onMonteCarloProgress ??
                        null,

                    onExactProgress:
                        runOptions
                            .onExactProgress ??
                        null

                });


        if (!isObject(resolved)) {

            throw new TypeError(
                "resolveAnalysis() must return an object."
            );

        }


        return {

            probability:
                this.normalize(
                    resolved
                        .probability ??
                    resolved
                ),

            method:
                resolved.method ??
                runOptions.mode ??
                "unknown",

            monteCarlo:
                resolved.monteCarlo ??
                null,

            exact:
                resolved.exact ??
                null

        };

    }


    toDefinition({

        name =
            "probability",

        priority =
            10

    } = {}) {

        return {

            name,

            priority,

            run:
                context =>
                    this.run(
                        context
                    ),

            metadata: {

                version:
                    PROBABILITY_PIPELINE_VERSION,

                type:
                    "probability"

            }

        };

    }


    get summary() {

        return {

            version:
                PROBABILITY_PIPELINE_VERSION,

            hasNormalizer:
                typeof this
                    .normalizeProbability ===
                    "function",

            hasResolver:
                typeof this
                    .resolveAnalysis ===
                    "function"

        };

    }

}
