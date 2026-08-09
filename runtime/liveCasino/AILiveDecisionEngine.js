/**
 * Baccarat Analyzer V10.5.4
 * Path: runtime/liveCasino/AILiveDecisionEngine.js
 *
 * Converges Probability → EV → Confidence → Risk → Ranking →
 * Recommendation into one live, explainable next-round decision.
 */

export const AI_LIVE_DECISION_ENGINE_VERSION =
    "10.5.0";

export const AI_LIVE_DECISION_CALIBRATION_VERSION =
    "10.5.2";

export const EXACT_OPPORTUNITY_CONFIRMATION_ENGINE_VERSION =
    "10.5.4";


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
    [LiveDecisionCategory.RISK_TOO_HIGH]: "波動過高"
});


export const DEFAULT_LIVE_DECISION_THRESHOLDS = Object.freeze({
    minPositiveEV: 0,
    minConfidence: 0.70,
    minRelativeAdvantage: 0.001,
    /**
     * relativeRisk is standard deviation / maximum net profit.
     * It is a volatility ratio, not a loss probability. Even-money Baccarat
     * main bets normally sit close to 0.95, so the former 0.65 default made
     * real Player / Banker signals structurally unable to pass this gate.
     */
    maxRelativeRisk: 1.05,
    minMonteCarloSamples: 1000
});


const DEFAULT_Z_SCORE = 1.959963984540054;


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


function normalizeConfidenceRatio(value) {
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


function ratioText(value) {
    return Number.isFinite(value)
        ? value.toFixed(3)
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


function unwrapConfidence(value) {
    if (Number.isFinite(value)) {
        return normalizeConfidenceRatio(value);
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
            value.value
        ]
    ) {
        const normalized =
            unwrapConfidence(candidate);

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
            unwrapConfidence(candidate);

        if (Number.isFinite(result)) {
            return result;
        }
    }

    return null;
}


function unwrapNonNegativeMetric(value) {
    if (Number.isFinite(value)) {
        return value >= 0
            ? value
            : null;
    }

    if (!value || typeof value !== "object") {
        return null;
    }

    for (
        const candidate of [
            value.relativeRisk,
            value.risk,
            value.value
        ]
    ) {
        const normalized =
            unwrapNonNegativeMetric(candidate);

        if (Number.isFinite(normalized)) {
            return normalized;
        }
    }

    return null;
}


function extractRiskRecord(
    analysis,
    key,
    ranking
) {
    const source =
        analysis.risk?.[key];

    if (
        source &&
        typeof source === "object"
    ) {
        return source;
    }

    if (
        ranking &&
        typeof ranking === "object"
    ) {
        return ranking;
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
            unwrapNonNegativeMetric(candidate);

        if (Number.isFinite(result)) {
            return result;
        }
    }

    return null;
}


function extractStandardDeviation(
    analysis,
    key,
    ranking
) {
    const record =
        extractRiskRecord(
            analysis,
            key,
            ranking
        );

    return finite(
        record?.standardDeviation ??
        analysis.standardDeviation?.[key] ??
        ranking?.standardDeviation
    );
}


function extractZScore(
    analysis,
    key
) {
    const value =
        analysis.confidence?.[key]
            ?.zScore ??
        analysis.confidenceDetails?.[key]
            ?.zScore;

    return Number.isFinite(value) &&
        value > 0
        ? value
        : DEFAULT_Z_SCORE;
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


function resolveEvidence({
    analysis,
    key,
    ev,
    confidence,
    ranking
}) {
    const methodKey =
        normalizeKey(analysis.method)
            .replaceAll("-", "");

    const sampleSize =
        extractSampleSize(analysis);

    const hasExact =
        Boolean(analysis.exact) &&
        (
            methodKey === "exact" ||
            methodKey === "hybrid"
        );

    const isMonteCarlo =
        methodKey === "montecarlo";

    const standardDeviation =
        extractStandardDeviation(
            analysis,
            key,
            ranking
        );

    const zScore =
        extractZScore(
            analysis,
            key
        );

    const marginOfError =
        hasExact
            ? 0
            : isMonteCarlo &&
                Number.isInteger(sampleSize) &&
                sampleSize > 0 &&
                Number.isFinite(standardDeviation)
                ? zScore *
                    standardDeviation /
                    Math.sqrt(sampleSize)
                : null;

    const evLowerBound =
        Number.isFinite(marginOfError)
            ? ev - marginOfError
            : null;

    const evUpperBound =
        Number.isFinite(marginOfError)
            ? ev + marginOfError
            : null;

    let source = "legacy";
    let label = "既有分析";
    let shortLabel = "既有分析";

    if (hasExact && methodKey === "hybrid") {
        source = "hybrid-exact";
        label = "混合精算（Exact）";
        shortLabel = "Exact";
    }
    else if (hasExact) {
        source = "exact";
        label = "精確列舉";
        shortLabel = "Exact";
    }
    else if (isMonteCarlo) {
        source = "monte-carlo";
        label = Number.isInteger(sampleSize)
            ? `快速模擬 ${sampleSize.toLocaleString()} 次`
            : "快速模擬";
        shortLabel = Number.isInteger(sampleSize)
            ? `MC ${sampleSize.toLocaleString()}`
            : "MC";
    }
    else if (methodKey === "provided") {
        source = "provided";
        label = "外部機率資料";
        shortLabel = "外部資料";
    }

    return {
        source,
        label,
        shortLabel,
        method:
            analysis.method ?? null,
        provisional:
            isMonteCarlo &&
            !hasExact,
        hasExact,
        sampleSize,
        confidence:
            hasExact
                ? 1
                : confidence,
        rawConfidence:
            confidence,
        zScore:
            Number.isFinite(zScore)
                ? zScore
                : null,
        standardDeviation,
        marginOfError,
        evLowerBound,
        evUpperBound,
        uncertaintyComplete:
            hasExact ||
            (
                isMonteCarlo &&
                Number.isFinite(marginOfError)
            )
    };
}


function extractSizing(
    analysis,
    key,
    recommendation,
    ranking
) {
    const kelly =
        analysis.kelly?.[key] ??
        {};

    return {
        fullKelly:
            finite(
                kelly.fullKelly ??
                ranking?.fullKelly
            ),
        appliedKelly:
            finite(
                kelly.appliedKelly ??
                ranking?.kelly
            ),
        rawAmount:
            finite(
                kelly.rawAmount ??
                ranking?.rawAmount ??
                ranking?.amount
            ),
        calculatedAmount:
            finite(
                kelly.amount ??
                analysis.amount?.[key] ??
                ranking?.amount,
                0
            ) ?? 0,
        minBet:
            finite(
                recommendation.limits?.minBet
            ),
        maxBet:
            finite(
                recommendation.limits?.maxBet
            ),
        bankroll:
            finite(
                kelly.bankroll
            )
    };
}


function createBlocker(code, message) {
    return {
        code,
        message
    };
}


function extractUpstreamReason(
    recommendation,
    key
) {
    const rejected =
        Array.isArray(recommendation.rejected)
            ? recommendation.rejected
            : [];

    const item =
        rejected.find(candidate =>
            normalizeKey(
                candidate?.key ??
                candidate?.name ??
                candidate?.bet
            ) === key
        );

    const recommendationRejected =
        recommendation.shouldBet === false ||
        normalizeKey(
            recommendation.action
        ) === "skip";

    const reasons =
        Array.isArray(item?.rejectedReasons)
            ? item.rejectedReasons
            : recommendationRejected &&
                Array.isArray(
                    recommendation.reasons
                )
                ? recommendation.reasons
                : [];

    return reasons.find(reason =>
        typeof reason === "string" &&
        reason.trim().length > 0
    ) ?? null;
}


function createWaitingDecision(reason) {
    const probability =
        extractProbability({});
    const ev =
        extractEV({});

    return {
        version:
            AI_LIVE_DECISION_ENGINE_VERSION,
        calibrationVersion:
            AI_LIVE_DECISION_CALIBRATION_VERSION,
        exactConfirmationVersion:
            EXACT_OPPORTUNITY_CONFIRMATION_ENGINE_VERSION,
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
        headlineLabel:
            "狀態",
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
        sizing: {
            fullKelly: null,
            appliedKelly: null,
            rawAmount: null,
            calculatedAmount: 0,
            minBet: null,
            maxBet: null,
            bankroll: null
        },
        evidence: {
            source: "none",
            label: "等待分析",
            shortLabel: "等待",
            method: null,
            provisional: true,
            hasExact: false,
            sampleSize: null,
            confidence: null,
            rawConfidence: null,
            zScore: null,
            standardDeviation: null,
            marginOfError: null,
            evLowerBound: null,
            evUpperBound: null,
            uncertaintyComplete: false,
            statisticallyPositiveEV: false,
            exactConfirmationPass: false,
            robustPositiveEV: false
        },
        blockers: [
            createBlocker(
                "INSUFFICIENT_DATA",
                reason
            )
        ],
        primaryBlocker:
            reason,
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
            minPositiveEV,
            minConfidence,
            minRelativeAdvantage,
            maxRelativeRisk,
            minMonteCarloSamples
        } = this.thresholds;

        if (
            !Number.isFinite(minPositiveEV) ||
            minPositiveEV < 0
        ) {
            throw new RangeError(
                "minPositiveEV must be >= 0."
            );
        }

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
            maxRelativeRisk < 0
        ) {
            throw new RangeError(
                "maxRelativeRisk must be a non-negative volatility ratio."
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

        const hasValidBetRecommendation =
            coreShouldBet &&
            isMainKey(recommendationKey);

        const strictCandidateKey =
            hasValidBetRecommendation
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

        const riskRecord =
            extractRiskRecord(
                analysis,
                strictCandidateKey,
                ranked
            );

        const relativeAdvantage =
            best.ev - runnerUp.ev;

        const positiveEV =
            decisionCandidate.ev >
                this.thresholds.minPositiveEV;

        const evidence =
            resolveEvidence({
                analysis,
                key:
                    strictCandidateKey,
                ev:
                    decisionCandidate.ev,
                confidence,
                ranking:
                    ranked
            });

        const statisticallyPositiveEV =
            positiveEV &&
            evidence.uncertaintyComplete &&
            (
                evidence.hasExact ||
                (
                    Number.isFinite(
                        evidence.evLowerBound
                    ) &&
                    evidence.evLowerBound >
                        this.thresholds
                            .minPositiveEV
                )
            );

        const exactConfirmationPass =
            evidence.hasExact === true;

        const robustPositiveEV =
            statisticallyPositiveEV &&
            exactConfirmationPass;

        evidence.statisticallyPositiveEV =
            statisticallyPositiveEV;
        evidence.exactConfirmationPass =
            exactConfirmationPass;
        evidence.robustPositiveEV =
            robustPositiveEV;

        const confidencePass =
            Number.isFinite(
                evidence.confidence
            ) &&
            evidence.confidence >=
                this.thresholds.minConfidence;

        const riskTooHigh =
            Number.isFinite(risk) &&
            risk >
                this.thresholds.maxRelativeRisk;

        const sizing =
            extractSizing(
                analysis,
                strictCandidateKey,
                recommendation,
                ranked
            );

        const blockers = [];

        if (!positiveEV) {
            blockers.push(
                createBlocker(
                    "NEGATIVE_EV",
                    `${best.label} EV ${percentText(best.ev)}，尚未超過正 EV 門檻。`
                )
            );
        }

        if (
            positiveEV &&
            !exactConfirmationPass
        ) {
            blockers.push(
                createBlocker(
                    "EXACT_CONFIRMATION_REQUIRED",
                    `${decisionCandidate.label}的 MC 正 EV 只列為暫定候選；必須等待同一局 Exact 精算確認。`
                )
            );
        }

        if (
            positiveEV &&
            !evidence.uncertaintyComplete
        ) {
            blockers.push(
                createBlocker(
                    "UNCERTAINTY_MISSING",
                    "正 EV 尚缺少完整抽樣誤差或標準差資料。"
                )
            );
        }
        else if (
            positiveEV &&
            !statisticallyPositiveEV
        ) {
            blockers.push(
                createBlocker(
                    "UNCERTAINTY_CROSSES_ZERO",
                    Number.isFinite(
                        evidence.evLowerBound
                    )
                        ? `${decisionCandidate.label} EV ${percentText(decisionCandidate.ev)}，但 95% EV 下界 ${percentText(evidence.evLowerBound)} 尚未大於 0。`
                        : `${decisionCandidate.label}正 EV 尚未超過估計誤差。`
                )
            );
        }

        if (
            positiveEV &&
            !confidencePass
        ) {
            blockers.push(
                createBlocker(
                    "LOW_EVIDENCE_CONFIDENCE",
                    Number.isFinite(
                        evidence.confidence
                    )
                        ? `估計可靠度 ${percentText(evidence.confidence)}，低於 ${percentText(this.thresholds.minConfidence)} 門檻。`
                        : "尚未取得估計可靠度。"
                )
            );
        }

        if (
            positiveEV &&
            !Number.isFinite(risk)
        ) {
            blockers.push(
                createBlocker(
                    "VOLATILITY_MISSING",
                    "尚未取得主注相對波動比。"
                )
            );
        }
        else if (
            positiveEV &&
            riskTooHigh
        ) {
            blockers.push(
                createBlocker(
                    "VOLATILITY_TOO_HIGH",
                    `相對波動比 ${ratioText(risk)}，超過 ${ratioText(this.thresholds.maxRelativeRisk)} 門檻。`
                )
            );
        }

        if (
            positiveEV &&
            !hasValidBetRecommendation
        ) {
            if (
                Number.isFinite(
                    sizing.minBet
                ) &&
                sizing.calculatedAmount <
                    sizing.minBet
            ) {
                blockers.push(
                    createBlocker(
                        "BELOW_MIN_BET",
                        `Kelly 試算 ${Math.floor(sizing.calculatedAmount)}，低於最低下注 ${Math.floor(sizing.minBet)}。`
                    )
                );
            }
            else {
                const upstreamReason =
                    extractUpstreamReason(
                        recommendation,
                        strictCandidateKey
                    );

                blockers.push(
                    createBlocker(
                        "UPSTREAM_RECOMMENDATION_BLOCKED",
                        upstreamReason ??
                        "上游推薦尚未通過完整 Kelly 與下注條件。"
                    )
                );
            }
        }

        let category;
        let action =
            LiveDecisionAction.WAIT;
        let reason;

        if (
            positiveEV &&
            (
                !Number.isFinite(risk) ||
                !evidence
                    .uncertaintyComplete
            )
        ) {
            category =
                LiveDecisionCategory.INSUFFICIENT_DATA;
            reason =
                blockers[0]?.message ??
                `${decisionCandidate.label}雖為正 EV，但證據資料尚未完整。`;
        }
        else if (
            positiveEV &&
            !statisticallyPositiveEV
        ) {
            category =
                LiveDecisionCategory.WEAK_SIGNAL;
            reason =
                blockers[0]?.message ??
                `${decisionCandidate.label}正 EV 尚未超過估計誤差。`;
        }
        else if (
            robustPositiveEV &&
            riskTooHigh
        ) {
            category =
                LiveDecisionCategory.RISK_TOO_HIGH;
            reason =
                blockers.find(item =>
                    item.code ===
                        "VOLATILITY_TOO_HIGH"
                )?.message ??
                `${decisionCandidate.label}相對波動過高。`;
        }
        else if (
            robustPositiveEV &&
            exactConfirmationPass &&
            hasValidBetRecommendation &&
            confidencePass
        ) {
            category =
                LiveDecisionCategory.POSITIVE_EV;
            action =
                LiveDecisionAction.BET;
            reason =
                `${decisionCandidate.label}具穩健正 EV，證據、波動與 Kelly 均通過下注門檻。`;
        }
        else if (positiveEV) {
            category =
                LiveDecisionCategory.WEAK_SIGNAL;
            reason =
                blockers[0]?.message ??
                `${decisionCandidate.label}雖為正 EV，但尚未通過完整下注門檻。`;
        }
        else if (
            relativeAdvantage >=
                this.thresholds
                    .minRelativeAdvantage
        ) {
            category =
                LiveDecisionCategory.RELATIVE_BEST;
            reason =
                `${best.label}只是目前相對最佳，仍為負 EV；相對差距 +${percentText(relativeAdvantage)}，不構成下注建議。`;
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

        const headlineLabel =
            action === LiveDecisionAction.BET
                ? "推薦"
                : positiveEV
                    ? "正 EV 候選"
                    : category ===
                        LiveDecisionCategory.NO_EDGE
                        ? "比較結果"
                        : "相對最佳";

        const primaryBlocker =
            action === LiveDecisionAction.BET
                ? null
                : blockers[0]?.message ??
                    reason;

        return {
            version:
                AI_LIVE_DECISION_ENGINE_VERSION,
            calibrationVersion:
                AI_LIVE_DECISION_CALIBRATION_VERSION,
            exactConfirmationVersion:
                EXACT_OPPORTUNITY_CONFIRMATION_ENGINE_VERSION,
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
            headlineLabel,
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
            riskLabel:
                riskRecord?.riskLabel ??
                ranked?.riskLabel ??
                null,
            amount,
            sizing,
            evidence,
            blockers,
            primaryBlocker,
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
            calibrationVersion:
                AI_LIVE_DECISION_CALIBRATION_VERSION,
            exactConfirmationVersion:
                EXACT_OPPORTUNITY_CONFIRMATION_ENGINE_VERSION,
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
