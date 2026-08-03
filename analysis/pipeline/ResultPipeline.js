/**
 * Baccarat Analyzer V3.6.2
 * analysis/pipeline/ResultPipeline.js
 *
 * 最終結果組裝器。
 *
 * 不負責任何計算，只負責把前面各 Pipeline
 * 產生的共享 state 整理成 Analyzer-compatible output。
 */

export const RESULT_PIPELINE_VERSION = "3.6.2";

function isObject(value) {
    return value !== null &&
        typeof value === "object" &&
        !Array.isArray(value);
}

function arrayOrEmpty(value) {
    return Array.isArray(value)
        ? value
        : [];
}

function objectOrEmpty(value) {
    return isObject(value)
        ? value
        : {};
}

function finiteOrNull(value) {
    return Number.isFinite(value)
        ? value
        : null;
}

export default class ResultPipeline {
    constructor({
        includeInternalState = false
    } = {}) {
        this.includeInternalState =
            Boolean(includeInternalState);

        this.lastResult = null;
    }

    buildSummary(state) {
        return {
            method:
                state.method ?? null,

            roundCount:
                state.roundCount ?? 0,

            historyCount:
                state.historyCount ?? 0,

            bankroll:
                finiteOrNull(
                    state.bankroll
                ),

            physicalRemaining:
                state.physicalRemaining ??
                state.remainingCards ??
                null,

            observableRemaining:
                state.observableRemaining ??
                null,

            unknownCards:
                state.unknownCards ??
                null,

            bestBet:
                state.best?.name ??
                state.recommendedBet ??
                null,

            shouldBet:
                Boolean(
                    state.shouldBet
                ),

            recommendedAmount:
                state.recommendedAmount ??
                state.recommendation?.amount ??
                0,

            overallConfidence:
                finiteOrNull(
                    state.overallConfidence
                ),

            candidateCount:
                arrayOrEmpty(
                    state.recommendationCandidates
                ).length
        };
    }

    run({ state }) {
        const recommendation =
            objectOrEmpty(
                state.recommendation
            );

        const result = {
            version:
                RESULT_PIPELINE_VERSION,

            method:
                state.method ?? null,

            probability:
                objectOrEmpty(
                    state.probability
                ),

            monteCarlo:
                state.monteCarlo ?? null,

            exact:
                state.exact ?? null,

            ev:
                objectOrEmpty(
                    state.ev
                ),

            evStatus:
                objectOrEmpty(
                    state.evStatus
                ),

            kelly:
                objectOrEmpty(
                    state.kelly
                ),

            fullKelly:
                objectOrEmpty(
                    state.fullKelly
                ),

            amount:
                objectOrEmpty(
                    state.amount
                ),

            risk:
                objectOrEmpty(
                    state.risk
                ),

            riskLevel:
                objectOrEmpty(
                    state.riskLevel
                ),

            riskLabel:
                objectOrEmpty(
                    state.riskLabel
                ),

            confidence:
                objectOrEmpty(
                    state.confidence
                ),

            confidencePercent:
                objectOrEmpty(
                    state.confidencePercent
                ),

            confidenceLevel:
                objectOrEmpty(
                    state.confidenceLevel
                ),

            confidenceLabel:
                objectOrEmpty(
                    state.confidenceLabel
                ),

            confidenceProvisional:
                objectOrEmpty(
                    state.confidenceProvisional
                ),

            confidenceDetails:
                objectOrEmpty(
                    state.confidenceDetails
                ),

            overallConfidence:
                finiteOrNull(
                    state.overallConfidence
                ),

            overallConfidencePercent:
                finiteOrNull(
                    state.overallConfidencePercent
                ),

            overallConfidenceLevel:
                state.overallConfidenceLevel ??
                null,

            overallConfidenceLabel:
                state.overallConfidenceLabel ??
                null,

            ranking:
                arrayOrEmpty(
                    state.ranking
                ),

            mainRanking:
                arrayOrEmpty(
                    state.mainRanking ??
                    state.ranking
                ),

            topRanking:
                arrayOrEmpty(
                    state.topRanking
                ),

            rejectedRanking:
                arrayOrEmpty(
                    state.rejectedRanking
                ),

            best:
                state.best ?? null,

            bestEV:
                finiteOrNull(
                    state.bestEV
                ),

            bestProbability:
                finiteOrNull(
                    state.bestProbability
                ),

            recommendation,

            shouldBet:
                Boolean(
                    state.shouldBet ??
                    recommendation.shouldBet
                ),

            recommendationAction:
                state.recommendationAction ??
                recommendation.action ??
                null,

            recommendationDecision:
                state.recommendationDecision ??
                recommendation.decision ??
                null,

            recommendationCandidates:
                arrayOrEmpty(
                    state.recommendationCandidates ??
                    recommendation.candidates
                ),

            recommendationRejected:
                arrayOrEmpty(
                    state.recommendationRejected ??
                    recommendation.rejected
                ),

            recommendedBet:
                state.recommendedBet ??
                recommendation.bet ??
                null,

            recommendedLabel:
                state.recommendedLabel ??
                recommendation.label ??
                null,

            recommendedAmount:
                state.recommendedAmount ??
                recommendation.amount ??
                0,

            recommendationReasons:
                arrayOrEmpty(
                    state.recommendationReasons ??
                    recommendation.reasons
                ),

            recommendationWarnings:
                arrayOrEmpty(
                    state.recommendationWarnings ??
                    recommendation.warnings
                ),

            recommendationHeadline:
                state.recommendationHeadline ??
                recommendation.headline ??
                "",

            recommendationMessage:
                state.recommendationMessage ??
                recommendation.message ??
                "",

            bankroll:
                finiteOrNull(
                    state.bankroll
                ),

            bettingLimits:
                objectOrEmpty(
                    state.bettingLimits
                ),

            roundCount:
                state.roundCount ?? 0,

            historyCount:
                state.historyCount ?? 0,

            generatedAfterRound:
                state.generatedAfterRound ??
                state.roundCount ??
                0,

            physicalRemaining:
                state.physicalRemaining ??
                state.remainingCards ??
                null,

            observableRemaining:
                state.observableRemaining ??
                null,

            unknownCards:
                state.unknownCards ??
                null,

            summary:
                this.buildSummary(
                    state
                )
        };

        if (this.includeInternalState) {
            result.internalState = {
                ...state
            };
        }

        this.lastResult = result;

        return {
            analysisResult: result,
            finalResult: result
        };
    }

    toDefinition({
        name = "result",
        priority = 70
    } = {}) {
        return {
            name,
            priority,
            requires: [
                "probability",
                "ev",
                "ranking",
                "recommendation"
            ],
            run:
                context =>
                    this.run(context),
            metadata: {
                version:
                    RESULT_PIPELINE_VERSION,
                type:
                    "result"
            }
        };
    }

    get summary() {
        return {
            version:
                RESULT_PIPELINE_VERSION,

            hasLastResult:
                Boolean(
                    this.lastResult
                ),

            includeInternalState:
                this.includeInternalState,

            lastMethod:
                this.lastResult?.method ??
                null,

            lastShouldBet:
                this.lastResult?.shouldBet ??
                null
        };
    }
}
