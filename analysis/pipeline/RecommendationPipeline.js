/**
 * Baccarat Analyzer V3.6.1
 * analysis/pipeline/RecommendationPipeline.js
 *
 * 與現有 analysis/recommendation.js 相容。
 *
 * 輸入：
 * - state.ranking 或 state.mainRanking
 *
 * 輸出：
 * - recommendation
 * - shouldBet
 * - recommendationAction
 * - recommendationDecision
 * - recommendationCandidates
 * - recommendationRejected
 * - recommendedBet
 * - recommendedAmount
 * - recommendationReasons
 * - recommendationWarnings
 */

export const RECOMMENDATION_PIPELINE_VERSION = "3.6.1";

function isObject(value) {
    return value !== null &&
        typeof value === "object" &&
        !Array.isArray(value);
}

export default class RecommendationPipeline {
    constructor({
        engine,
        cloneEngine = true
    } = {}) {
        if (!engine || typeof engine.calculate !== "function") {
            throw new Error(
                "RecommendationPipeline requires a Recommendation engine."
            );
        }

        this.engine = engine;
        this.cloneEngine = Boolean(cloneEngine);
        this.lastRecommendation = null;
    }

    resolveEngine(state) {
        const options =
            state.runOptions?.recommendationOptions ??
            state.recommendationOptions ??
            null;

        if (!options || !isObject(options)) {
            return this.engine;
        }

        if (
            this.cloneEngine &&
            typeof this.engine.clone === "function"
        ) {
            return this.engine
                .clone()
                .updateOptions(options);
        }

        if (typeof this.engine.updateOptions === "function") {
            this.engine.updateOptions(options);
            return this.engine;
        }

        throw new Error(
            "Recommendation engine cannot apply runtime options."
        );
    }

    getRanking(state) {
        const ranking =
            state.mainRanking ??
            state.ranking;

        if (!Array.isArray(ranking)) {
            throw new Error(
                "RecommendationPipeline requires state.ranking or state.mainRanking."
            );
        }

        return ranking;
    }

    run({ state }) {
        const ranking =
            this.getRanking(state);

        const engine =
            this.resolveEngine(state);

        const recommendation =
            engine.calculate(ranking);

        if (!isObject(recommendation)) {
            throw new TypeError(
                "Recommendation engine calculate() must return an object."
            );
        }

        if (typeof recommendation.shouldBet !== "boolean") {
            throw new TypeError(
                "Recommendation result requires shouldBet."
            );
        }

        const candidates =
            Array.isArray(
                recommendation.candidates
            )
                ? recommendation.candidates
                : [];

        const rejected =
            Array.isArray(
                recommendation.rejected
            )
                ? recommendation.rejected
                : [];

        const reasons =
            Array.isArray(
                recommendation.reasons
            )
                ? recommendation.reasons
                : [];

        const warnings =
            Array.isArray(
                recommendation.warnings
            )
                ? recommendation.warnings
                : [];

        this.lastRecommendation =
            recommendation;

        return {
            recommendation,
            shouldBet:
                recommendation.shouldBet,
            recommendationAction:
                recommendation.action ?? null,
            recommendationDecision:
                recommendation.decision ?? null,
            recommendationCandidates:
                candidates,
            recommendationRejected:
                rejected,
            recommendedBet:
                recommendation.bet ?? null,
            recommendedLabel:
                recommendation.label ?? null,
            recommendedAmount:
                recommendation.amount ?? 0,
            recommendationReasons:
                reasons,
            recommendationWarnings:
                warnings,
            recommendationHeadline:
                recommendation.headline ?? "",
            recommendationMessage:
                recommendation.message ?? ""
        };
    }

    toDefinition({
        name = "recommendation",
        priority = 60
    } = {}) {
        return {
            name,
            priority,
            requires: [
                "ranking"
            ],
            run:
                context =>
                    this.run(context),
            metadata: {
                version:
                    RECOMMENDATION_PIPELINE_VERSION,
                type:
                    "recommendation"
            }
        };
    }

    get summary() {
        return {
            version:
                RECOMMENDATION_PIPELINE_VERSION,
            hasLastRecommendation:
                Boolean(this.lastRecommendation),
            shouldBet:
                this.lastRecommendation
                    ?.shouldBet ??
                null,
            action:
                this.lastRecommendation
                    ?.action ??
                null,
            candidateCount:
                this.lastRecommendation
                    ?.candidates
                    ?.length ??
                0
        };
    }
}
