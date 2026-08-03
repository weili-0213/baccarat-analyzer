/**
 * Baccarat Analyzer V3.5.1
 * analysis/pipeline/ConfidencePipeline.js
 *
 * Compatible with analysis/confidence.js:
 * engine.calculate({ name, monteCarloProbability, sampleSize, exactProbability })
 * engine.overall(results)
 */

export const CONFIDENCE_PIPELINE_VERSION = "3.5.1";

function isObject(value) {
    return value !== null &&
        typeof value === "object" &&
        !Array.isArray(value);
}

function firstFinite(...values) {
    for (const value of values) {
        if (Number.isFinite(value)) {
            return value;
        }
    }

    return null;
}

function clamp01(value) {
    return Math.min(1, Math.max(0, value));
}

export default class ConfidencePipeline {
    constructor({
        engine,
        betConfig,
        overallMethod = "engine",
        defaultSampleSize = null
    } = {}) {
        if (!engine) {
            throw new Error(
                "ConfidencePipeline requires a Confidence engine."
            );
        }

        if (!isObject(betConfig)) {
            throw new TypeError(
                "ConfidencePipeline requires betConfig."
            );
        }

        if (
            !["engine", "average", "maximum", "bestEV"]
                .includes(overallMethod)
        ) {
            throw new Error(
                `Unknown overall confidence method: ${overallMethod}`
            );
        }

        this.engine = engine;
        this.betConfig = betConfig;
        this.overallMethod = overallMethod;
        this.defaultSampleSize = defaultSampleSize;
    }

    getSampleSize(state) {
        const runOptions = isObject(state.runOptions)
            ? state.runOptions
            : {};

        const sampleSize = firstFinite(
            runOptions.sampleSize,
            runOptions.simulations,
            state.sampleSize,
            state.monteCarlo?.sampleSize,
            state.monteCarlo?.simulations,
            state.monteCarlo?.total,
            state.monteCarlo?.trials,
            this.defaultSampleSize
        );

        if (
            !Number.isInteger(sampleSize) ||
            sampleSize <= 0
        ) {
            throw new RangeError(
                "ConfidencePipeline requires a positive integer sampleSize."
            );
        }

        return sampleSize;
    }

    getMonteCarloProbability(name, state) {
        return firstFinite(
            state.monteCarlo?.probability?.[name],
            state.monteCarlo?.probabilities?.[name],
            state.monteCarlo?.[name],
            state.probability?.[name]
        );
    }

    getExactProbability(name, state) {
        return firstFinite(
            state.exact?.probability?.[name],
            state.exact?.probabilities?.[name],
            state.exact?.[name]
        );
    }

    calculateOverall(
        details,
        confidence,
        state
    ) {
        if (
            this.overallMethod === "engine" &&
            typeof this.engine.overall === "function"
        ) {
            return this.engine.overall(details);
        }

        const entries = Object.entries(confidence)
            .filter(
                ([name, value]) =>
                    Number.isFinite(value) &&
                    Number.isFinite(state.ev?.[name])
            );

        if (entries.length === 0) {
            return {
                confidenceScore: 0,
                confidencePercent: 0,
                confidenceLevel: "veryLow",
                confidenceLabel: "極低可信度",
                itemCount: 0
            };
        }

        let score;

        if (this.overallMethod === "bestEV") {
            const [bestName] = [...entries]
                .sort(
                    ([left], [right]) =>
                        state.ev[right] -
                        state.ev[left]
                )[0];

            score = confidence[bestName];
        }
        else if (this.overallMethod === "maximum") {
            score = Math.max(
                ...entries.map(([, value]) => value)
            );
        }
        else {
            score =
                entries.reduce(
                    (total, [, value]) =>
                        total + value,
                    0
                ) /
                entries.length;
        }

        score = clamp01(score);

        const level =
            typeof this.engine.level === "function"
                ? this.engine.level(score)
                : null;

        const label =
            level &&
            typeof this.engine.levelLabel === "function"
                ? this.engine.levelLabel(level)
                : null;

        return {
            confidenceScore: score,
            confidencePercent: score * 100,
            confidenceLevel: level,
            confidenceLabel: label,
            itemCount: entries.length
        };
    }

    run({ state }) {
        if (!isObject(state.probability)) {
            throw new Error(
                "ConfidencePipeline requires state.probability."
            );
        }

        if (!isObject(state.ev)) {
            throw new Error(
                "ConfidencePipeline requires state.ev."
            );
        }

        if (typeof this.engine.calculate !== "function") {
            throw new Error(
                "Confidence engine requires calculate()."
            );
        }

        const sampleSize = this.getSampleSize(state);

        const confidenceDetails = {};
        const confidence = {};
        const confidencePercent = {};
        const confidenceLevel = {};
        const confidenceLabel = {};
        const confidenceProvisional = {};

        for (const name of Object.keys(this.betConfig)) {
            const monteCarloProbability =
                this.getMonteCarloProbability(
                    name,
                    state
                );

            if (!Number.isFinite(monteCarloProbability)) {
                continue;
            }

            const exactProbability =
                this.getExactProbability(
                    name,
                    state
                );

            const result = this.engine.calculate({
                name,
                monteCarloProbability,
                sampleSize,
                exactProbability
            });

            if (
                !isObject(result) ||
                !Number.isFinite(result.confidenceScore)
            ) {
                throw new TypeError(
                    `Confidence result for ${name} requires confidenceScore.`
                );
            }

            confidenceDetails[name] = result;
            confidence[name] =
                clamp01(result.confidenceScore);

            confidencePercent[name] =
                Number.isFinite(result.confidencePercent)
                    ? result.confidencePercent
                    : confidence[name] * 100;

            confidenceLevel[name] =
                result.confidenceLevel ?? null;

            confidenceLabel[name] =
                result.confidenceLabel ?? null;

            confidenceProvisional[name] =
                result.hasExact !== true;
        }

        const overall = this.calculateOverall(
            confidenceDetails,
            confidence,
            state
        );

        return {
            confidence,
            confidencePercent,
            confidenceLevel,
            confidenceLabel,
            confidenceProvisional,
            confidenceDetails,
            overallConfidence:
                overall.confidenceScore,
            overallConfidencePercent:
                overall.confidencePercent,
            overallConfidenceLevel:
                overall.confidenceLevel,
            overallConfidenceLabel:
                overall.confidenceLabel,
            overallConfidenceDetails:
                overall,
            confidenceSampleSize:
                sampleSize
        };
    }

    toDefinition({
        name = "confidence",
        priority = 40
    } = {}) {
        return {
            name,
            priority,
            requires: [
                "probability",
                "ev"
            ],
            run:
                context =>
                    this.run(context),
            metadata: {
                version:
                    CONFIDENCE_PIPELINE_VERSION,
                type:
                    "confidence"
            }
        };
    }

    get summary() {
        return {
            version:
                CONFIDENCE_PIPELINE_VERSION,
            bets:
                Object.keys(this.betConfig).length,
            overallMethod:
                this.overallMethod,
            engineCompatible:
                typeof this.engine.calculate ===
                    "function"
        };
    }
}
