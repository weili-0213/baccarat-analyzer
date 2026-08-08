/**
 * Baccarat Analyzer V10.5.0
 * Path: runtime/liveCasino/AILiveDecisionEngine.js
 *
 * Converges Probability → EV → Confidence → Risk → Ranking →
 * Recommendation into one live, explainable next-round decision.
 */

export const AI_LIVE_DECISION_ENGINE_VERSION =
    "10.5.0";


export const LiveDecisionCategory = Object.freeze({
    POSITIVE_EV: "positive-ev",
    RELATIVE_BEST: "relative-best",
    WEAK_SIGNAL: "weak-signal",
    NO_EDGE: "no-edge",
    INSUFFICIENT_DATA: "insufficient-data",
    RISK_TOO_HIGH: "risk-too-high"
});


export const LiveDecisionAction = Object.freeze({
    BET: "BET",
    WAIT: "WAIT"
});


export const LIVE_DECISION_CATEGORY_LABEL = Object.freeze({
    [LiveDecisionCategory.POSITIVE_EV]: "絕對正 EV",
    [LiveDecisionCategory.RELATIVE_BEST]: "相對最佳",
    [LiveDecisionCategory.WEAK_SIGNAL]: "弱勢訊號",
    [LiveDecisionCategory.NO_EDGE]: "無優勢",
    [LiveDecisionCategory.INSUFFICIENT_DATA]: "資料不足",
    [LiveDecisionCategory.RISK_TOO_HIGH]: "風險過高"
});


export const DEFAULT_LIVE_DECISION_THRESHOLDS = Object.freeze({
    minPositiveEV: 0,
    minConfidence: 0.70,
    minRelativeAdvantage: 0.001,
    maxRelativeRisk: 0.65,
    minMonteCarloSamples: 1000
});


const MAIN = Object.freeze([
    ["player", "閒家"],
    ["banker", "莊家"],
    ["tie", "和局"]
]);


function finite(value, fallback = null) {
    return Number.isFinite(value)
        ? value
        : fallback;
}


function normalizeRatio(value) {
    if (!Number.isFinite(value)) {
        return null;
    }

    if (value < 0 || value > 100) {
        return null;
    }

    if (value > 1 && value <= 100) {
        return value / 100;
    }

    return value;
}


function normalizeKey(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase();
}


function isMainKey(value) {
    return MAIN.some(([key]) =>
        key === value
    );
}


function labelFor(key) {
    return MAIN.find(([candidate]) =>
        candidate === key
    )?.[1] ?? "—";
}


function percentText(value) {
    return Number.isFinite(value)
        ? `${(value * 100).toFixed(2)}%`
        : "—";
}


function extractEV(analysis = {}) {
    const source =
        analysis.ev ??
        analysis.expectedValue ??
        {};

    return {
        player: finite(source.player ?? source.Player),
        banker: finite(source.banker ?? source.Banker),
        tie: finite(source.tie ?? source.Tie)
    };
}


function extractProbability(analysis = {}) {
    const source =
        analysis.probability ??
        analysis.probabilities ??
        analysis.nextProbability ??
        {};

    return {
        player: finite(source.player ?? source.Player),
        banker: finite(source.banker ?? source.Banker),
        tie: finite(source.tie ?? source.Tie)
    };
}


function rankingFor(analysis = {}, key) {
    const ranking =
        Array.isArray(analysis.mainRanking)
            ? analysis.mainRanking
            : Array.isArray(analysis.ranking)
                ? analysis.ranking
                : [];

    return ranking.find(item =>
        normalizeKey(
            item?.key ??
            item?.name ??
            item?.bet
        ) === key
    ) ?? null;
}


function unwrapRatio(value) {
    if (Number.isFinite(value)) {
        return normalizeRatio(value);
    }

    if (!value || typeof value !== "object") {
        return null;
    }

    for (
        const candidate of [
            value.confidenceScore,
            value.confidence,
            value.overall,
            value.score,
            value.value,
            value.relativeRisk,
            value.risk
        ]
    ) {
        const normalized =
            unwrapRatio(candidate);

        if (Number.isFinite(normalized)) {
            return normalized;
        }
    }

    return null;
}


function extractConfidence(
    analysis,
    key,
    recommendation,
    ranking
) {
    for (
        const candidate of [
            recommendation.confidence,
            analysis.overallConfidence,
            analysis.confidence?.overall,
            analysis.confidence?.[key],
            ranking?.confidence,
            ranking?.confidenceScore,
            ranking?.score
        ]
    ) {
        const result =
            unwrapRatio(candidate);

        if (Number.isFinite(result)) {
            return result;
        }
    }

    return null;
}


function extractRisk(
    analysis,
    key,
    recommendation,
    ranking
) {
    for (
        const candidate of [
            recommendation.risk,
            recommendation.relativeRisk,
            analysis.risk?.[key],
            ranking?.risk,
            ranking?.relativeRisk
        ]
    ) {
        const result =
            unwrapRatio(candidate);

        if (Number.isFinite(result)) {
            return result;
        }
    }

    return null;
}


function extractSampleSize(analysis = {}) {
    const monteCarlo =
        analysis.monteCarlo ??
        {};

    const value =
        monteCarlo.sampleSize ??
        monteCarlo.samples ??
        monteCarlo.simulations ??
        analysis.sampleSize ??
        null;

    return Number.isInteger(value) &&
        value >= 0
        ? value
        : null;
}


function createWaitingDecision(reason) {
    const probability =
        extractProbability({});
    const ev =
        extractEV({});

    return {
        version:
            AI_LIVE_DECISION_ENGINE_VERSION,
        ready:
            false,
        category:
            LiveDecisionCategory.INSUFFICIENT_DATA,
        categoryLabel:
            LIVE_DECISION_CATEGORY_LABEL[
                LiveDecisionCategory.INSUFFICIENT_DATA
            ],
        action:
            LiveDecisionAction.WAIT,
        actionLabel:
            "觀望",
        recommendationKey:
            null,
        recommendationLabel:
            "—",
        strictAction:
            LiveDecisionAction.WAIT,
        strictKey:
            null,
        strictLabel:
            "等待分析",
        relativeKey:
            null,
        relativeLabel:
            "—",
        relativeEV:
            null,
        relativeAdvantage:
            null,
        probability,
        ev,
        confidence:
            null,
        confidencePercent:
            null,
        risk:
            null,
        amount:
            0,
        reason,
        pipeline: {
            probability: false,
            ev: false,
            confidence: false,
            risk: false,
            ranking: false,
            recommendation: false
        }
    };
}


export default class AILiveDecisionEngine {
    constructor(options = {}) {
        this.thresholds = {
            ...DEFAULT_LIVE_DECISION_THRESHOLDS,
            ...options
        };

        this.validateThresholds();
    }


    validateThresholds() {
        const {
            minConfidence,
            minRelativeAdvantage,
            maxRelativeRisk,
            minMonteCarloSamples
        } = this.thresholds;

        if (
            !Number.isFinite(minConfidence) ||
            minConfidence < 0 ||
            minConfidence > 1
        ) {
            throw new RangeError(
                "minConfidence must be between 0 and 1."
            );
        }

        if (
            !Number.isFinite(minRelativeAdvantage) ||
            minRelativeAdvantage < 0
        ) {
            throw new RangeError(
                "minRelativeAdvantage must be >= 0."
            );
        }

        if (
            !Number.isFinite(maxRelativeRisk) ||
            maxRelativeRisk < 0 ||
            maxRelativeRisk > 1
        ) {
            throw new RangeError(
                "maxRelativeRisk must be between 0 and 1."
            );
        }

        if (
            !Number.isInteger(minMonteCarloSamples) ||
            minMonteCarloSamples < 0
        ) {
            throw new RangeError(
                "minMonteCarloSamples must be a non-negative integer."
            );
        }
    }


    decide(analysis = null) {
        if (!analysis) {
            return createWaitingDecision(
                "尚未取得下一局分析。"
            );
        }

        const probability =
            extractProbability(analysis);
        const ev =
            extractEV(analysis);

        const candidates = MAIN
            .map(([key]) => ({
                key,
                label: labelFor(key),
                probability: probability[key],
                ev: ev[key]
            }))
            .filter(item =>
                Number.isFinite(item.ev)
            )
            .sort((left, right) =>
                right.ev - left.ev
            );

        const hasProbability =
            MAIN.every(([key]) =>
                Number.isFinite(probability[key])
            );

        const best =
            candidates[0] ??
            null;
        const runnerUp =
            candidates[1] ??
            null;

        const sampleSize =
            extractSampleSize(analysis);
        const method =
            normalizeKey(analysis.method);
        const samplesInsufficient =
            method === "montecarlo" &&
            Number.isInteger(sampleSize) &&
            sampleSize <
                this.thresholds
                    .minMonteCarloSamples;

        if (
            !hasProbability ||
            !best ||
            !runnerUp ||
            samplesInsufficient
        ) {
            const reason =
                samplesInsufficient
                    ? `資料不足：Monte Carlo 樣本 ${sampleSize}，低於 ${this.thresholds.minMonteCarloSamples}。`
                    : "資料不足：尚未取得完整的主注機率與 EV。";

            return {
                ...createWaitingDecision(reason),
                probability,
                ev,
                sampleSize,
                method: analysis.method ?? null
            };
        }

        const recommendation =
            analysis.recommendation ??
            analysis.decision?.recommendation ??
            {};

        const recommendationKey =
            normalizeKey(
                recommendation.key ??
                recommendation.bet ??
                recommendation.bestBet ??
                recommendation.name
            );

        const coreShouldBet =
            recommendation.shouldBet === true ||
            normalizeKey(recommendation.action) === "bet";

        const strictCandidateKey =
            coreShouldBet &&
            isMainKey(recommendationKey)
                ? recommendationKey
                : best.key;

        const decisionCandidate =
            candidates.find(item =>
                item.key === strictCandidateKey
            ) ?? best;

        const ranked =
            rankingFor(
                analysis,
                strictCandidateKey
            ) ??
            rankingFor(
                analysis,
                best.key
            );

        const confidence =
            extractConfidence(
                analysis,
                strictCandidateKey,
                recommendation,
                ranked
            );

        const risk =
            extractRisk(
                analysis,
                strictCandidateKey,
                recommendation,
                ranked
            );

        const relativeAdvantage =
            best.ev - runnerUp.ev;
        const positiveEV =
            decisionCandidate.ev >
                this.thresholds.minPositiveEV;
        const confidencePass =
            Number.isFinite(confidence) &&
            confidence >=
                this.thresholds.minConfidence;
        const riskTooHigh =
            Number.isFinite(risk) &&
            risk >
                this.thresholds.maxRelativeRisk;

        let category;
        let action =
            LiveDecisionAction.WAIT;
        let reason;

        if (
            positiveEV &&
            (
                !Number.isFinite(confidence) ||
                !Number.isFinite(risk)
            )
        ) {
            category =
                LiveDecisionCategory.INSUFFICIENT_DATA;
            reason =
                `${decisionCandidate.label}雖為正 EV，但信心或風險資料尚未完整。`;
        }
        else if (
            positiveEV &&
            riskTooHigh
        ) {
            category =
                LiveDecisionCategory.RISK_TOO_HIGH;
            reason =
                `風險過高：${decisionCandidate.label}風險 ${percentText(risk)}，超過 ${percentText(this.thresholds.maxRelativeRisk)} 門檻。`;
        }
        else if (
            positiveEV &&
            coreShouldBet &&
            confidencePass
        ) {
            category =
                LiveDecisionCategory.POSITIVE_EV;
            action =
                LiveDecisionAction.BET;
            reason =
                `${decisionCandidate.label}具正 EV，信心與風險均通過下注門檻。`;
        }
        else if (positiveEV) {
            category =
                LiveDecisionCategory.WEAK_SIGNAL;
            reason =
                Number.isFinite(confidence) &&
                !confidencePass
                    ? `${decisionCandidate.label}雖為正 EV，但信心 ${percentText(confidence)} 尚未達 ${percentText(this.thresholds.minConfidence)}。`
                    : `${decisionCandidate.label}雖為正 EV，但尚未通過完整推薦門檻。`;
        }
        else if (
            relativeAdvantage >=
                this.thresholds
                    .minRelativeAdvantage
        ) {
            category =
                LiveDecisionCategory.RELATIVE_BEST;
            reason =
                `${best.label}為目前最佳主注，但仍為負 EV；相對優勢 +${percentText(relativeAdvantage)}。`;
        }
        else {
            category =
                LiveDecisionCategory.NO_EDGE;
            reason =
                `所有主注均無正 EV，且最佳與次佳差距未達 ${percentText(this.thresholds.minRelativeAdvantage)}。`;
        }

        const betKey =
            action === LiveDecisionAction.BET
                ? strictCandidateKey
                : null;

        const displayKey =
            betKey ?? best.key;

        const amount =
            action === LiveDecisionAction.BET
                ? finite(
                    recommendation.amount ??
                    analysis.kelly?.[betKey]
                        ?.amount ??
                    analysis.amount?.[betKey],
                    0
                ) ?? 0
                : 0;

        return {
            version:
                AI_LIVE_DECISION_ENGINE_VERSION,
            ready:
                true,
            category,
            categoryLabel:
                LIVE_DECISION_CATEGORY_LABEL[
                    category
                ],
            action,
            actionLabel:
                action === LiveDecisionAction.BET
                    ? "可下注"
                    : "觀望",
            recommendationKey:
                displayKey,
            recommendationLabel:
                labelFor(displayKey),
            strictAction:
                action,
            strictKey:
                betKey,
            strictLabel:
                betKey
                    ? `下注 ${labelFor(betKey)}`
                    : "嚴格策略：觀望",
            relativeKey:
                best.key,
            relativeLabel:
                best.label,
            relativeEV:
                best.ev,
            runnerUpKey:
                runnerUp.key,
            runnerUpEV:
                runnerUp.ev,
            relativeAdvantage,
            probability,
            ev,
            confidence,
            confidencePercent:
                Number.isFinite(confidence)
                    ? confidence * 100
                    : null,
            risk,
            amount,
            shouldBet:
                action === LiveDecisionAction.BET,
            reason,
            sampleSize,
            method:
                analysis.method ?? null,
            pipeline: {
                probability: true,
                ev: true,
                confidence:
                    Number.isFinite(confidence),
                risk:
                    Number.isFinite(risk),
                ranking:
                    Boolean(ranked),
                recommendation:
                    Boolean(
                        analysis.recommendation ??
                        analysis.decision
                            ?.recommendation
                    )
            },
            thresholds: {
                ...this.thresholds
            }
        };
    }


    build(analysis = null) {
        return this.decide(analysis);
    }


    get summary() {
        return {
            version:
                AI_LIVE_DECISION_ENGINE_VERSION,
            categories:
                Object.values(
                    LiveDecisionCategory
                ),
            thresholds: {
                ...this.thresholds
            }
        };
    }
}
