/**
 * Baccarat Analyzer V10.6.0
 * Path: runtime/liveCasino/DecisionStabilityExplainabilityEngine.js
 *
 * Stabilizes the V10.5 decision pipeline after Exact confirmation and turns
 * every final decision into an immutable, explainable snapshot.
 *
 * Safety contract:
 * - Monte Carlo is provisional and can never publish a formal bet.
 * - Only a same-round Exact result can create FINAL_BET / FINAL_WAIT.
 * - A close Player/Banker EV call is neutralized instead of hard-picking a
 *   side that only wins through hidden floating-point precision.
 * - Opportunity maturity explains evidence; it never overrides action gates.
 */

import {
    LiveDecisionAction
} from "./AILiveDecisionEngine.js";


export const DECISION_STABILITY_EXPLAINABILITY_VERSION =
    "10.6.0";


export const StableDecisionLifecycle = Object.freeze({
    ANALYZING: "analyzing",
    EXACT_CONFIRMING: "exact-confirming",
    FINAL_BET: "final-bet",
    FINAL_WAIT: "final-wait",
    EXPIRED: "expired"
});


export const STABLE_DECISION_LIFECYCLE_LABEL = Object.freeze({
    [StableDecisionLifecycle.ANALYZING]:
        "分析中",
    [StableDecisionLifecycle.EXACT_CONFIRMING]:
        "Exact 最終確認中",
    [StableDecisionLifecycle.FINAL_BET]:
        "最終可下注",
    [StableDecisionLifecycle.FINAL_WAIT]:
        "最終觀望",
    [StableDecisionLifecycle.EXPIRED]:
        "決策已失效"
});


export const StableMarketState = Object.freeze({
    ANALYZING: "analyzing",
    CLOSE_CALL: "close-call",
    ACTIONABLE: "actionable",
    POSITIVE_BLOCKED: "positive-blocked",
    RISK_BLOCKED: "risk-blocked",
    RELATIVE_LEADER: "relative-leader",
    NO_EDGE: "no-edge",
    INSUFFICIENT_DATA: "insufficient-data",
    EXPIRED: "expired"
});


export const STABLE_MARKET_STATE_LABEL = Object.freeze({
    [StableMarketState.ANALYZING]:
        "等待 Exact 最終結果",
    [StableMarketState.CLOSE_CALL]:
        "閒莊近似持平",
    [StableMarketState.ACTIONABLE]:
        "已確認下注機會",
    [StableMarketState.POSITIVE_BLOCKED]:
        "正 EV 但門檻未齊",
    [StableMarketState.RISK_BLOCKED]:
        "波動過高",
    [StableMarketState.RELATIVE_LEADER]:
        "只有相對領先",
    [StableMarketState.NO_EDGE]:
        "目前無有效優勢",
    [StableMarketState.INSUFFICIENT_DATA]:
        "資料不足",
    [StableMarketState.EXPIRED]:
        "本局決策已失效"
});


export const DEFAULT_DECISION_STABILITY_OPTIONS = Object.freeze({
    /** 0.001 ratio = 0.10 percentage points. */
    closeCallEVGap: 0.001,
    minConfidence: 0.70,
    maxRelativeRisk: 1.05,
    maxAuditEntries: 50
});


export const OPPORTUNITY_MATURITY_WEIGHTS = Object.freeze({
    evEvidence: 30,
    exactConfirmation: 20,
    confidence: 20,
    risk: 15,
    kelly: 15
});


function finite(value, fallback = null) {
    return Number.isFinite(value)
        ? value
        : fallback;
}


function normalizeId(value) {
    return value === null ||
        value === undefined
        ? null
        : String(value);
}


function roundIdFor(analysis, fallback = null) {
    return normalizeId(
        analysis?.generatedAfterRound ??
        analysis?.roundNumber ??
        fallback
    );
}


function mainCandidateKey(decision = {}) {
    const key =
        decision.strictKey ??
        decision.recommendationKey ??
        decision.relativeKey ??
        null;

    return key === "player" ||
        key === "banker"
        ? key
        : null;
}


function candidateSnapshot(decision = {}) {
    const key =
        mainCandidateKey(decision) ??
        decision.recommendationKey ??
        decision.relativeKey ??
        null;

    return {
        key,
        label:
            decision.recommendationLabel ??
            decision.relativeLabel ??
            "—",
        ev:
            key && Number.isFinite(
                decision.ev?.[key]
            )
                ? decision.ev[key]
                : null,
        action:
            decision.action ??
            LiveDecisionAction.WAIT,
        category:
            decision.category ??
            null,
        amount:
            Number.isFinite(decision.amount)
                ? decision.amount
                : 0,
        evidence:
            decision.evidence?.shortLabel ??
            decision.evidence?.label ??
            "—"
    };
}


function blockerCodes(decision = {}) {
    return Array.isArray(decision.blockers)
        ? decision.blockers
            .map(blocker =>
                blocker?.code
            )
            .filter(Boolean)
        : [];
}


function deepFreeze(value, seen = new WeakSet()) {
    if (
        !value ||
        typeof value !== "object" ||
        seen.has(value)
    ) {
        return value;
    }

    seen.add(value);

    for (const child of Object.values(value)) {
        deepFreeze(child, seen);
    }

    return Object.freeze(value);
}


function copy(value) {
    if (value === undefined) {
        return undefined;
    }

    return JSON.parse(
        JSON.stringify(value)
    );
}


function component({
    key,
    label,
    earned,
    maximum,
    passed,
    detail
}) {
    return {
        key,
        label,
        earned:
            Math.max(
                0,
                Math.min(
                    maximum,
                    Math.round(earned)
                )
            ),
        maximum,
        passed:
            Boolean(passed),
        detail
    };
}


function marketStateFor(decision, {
    final,
    closeCall
}) {
    if (!final) {
        return StableMarketState.ANALYZING;
    }

    if (closeCall) {
        return StableMarketState.CLOSE_CALL;
    }

    if (
        decision.action ===
            LiveDecisionAction.BET
    ) {
        return StableMarketState.ACTIONABLE;
    }

    const codes =
        blockerCodes(decision);

    if (
        codes.includes(
            "VOLATILITY_TOO_HIGH"
        )
    ) {
        return StableMarketState.RISK_BLOCKED;
    }

    if (
        decision.evidence
            ?.statisticallyPositiveEV ||
        mainCandidateKey(decision) &&
            finite(
                decision.ev?.[
                    mainCandidateKey(decision)
                ]
            ) > 0
    ) {
        return StableMarketState.POSITIVE_BLOCKED;
    }

    if (
        decision.category ===
            "relative-best"
    ) {
        return StableMarketState.RELATIVE_LEADER;
    }

    if (
        decision.category ===
            "insufficient-data"
    ) {
        return StableMarketState.INSUFFICIENT_DATA;
    }

    return StableMarketState.NO_EDGE;
}


function closeCallFor(
    decision,
    threshold,
    final
) {
    const player =
        finite(decision.ev?.player);
    const banker =
        finite(decision.ev?.banker);
    const selected =
        mainCandidateKey(decision);

    if (
        !final ||
        !Number.isFinite(player) ||
        !Number.isFinite(banker) ||
        !selected
    ) {
        return {
            active: false,
            gap:
                Number.isFinite(player) &&
                Number.isFinite(banker)
                    ? Math.abs(
                        player - banker
                    )
                    : null,
            playerEV: player,
            bankerEV: banker,
            threshold
        };
    }

    const gap =
        Math.abs(player - banker);

    return {
        active:
            gap <= threshold,
        gap,
        playerEV: player,
        bankerEV: banker,
        threshold
    };
}


function maturityFor(decision, {
    exact,
    closeCall,
    options
}) {
    const selectedKey =
        mainCandidateKey(decision);
    const selectedEV =
        selectedKey
            ? finite(
                decision.ev?.[selectedKey]
            )
            : null;
    const robustPositive =
        decision.evidence
            ?.robustPositiveEV === true;
    const pointPositive =
        Number.isFinite(selectedEV) &&
        selectedEV > 0;

    const confidence =
        finite(
            decision.evidence
                ?.confidence,
            finite(decision.confidence)
        );
    const confidencePass =
        Number.isFinite(confidence) &&
        confidence >=
            options.minConfidence;
    const confidenceEarned =
        confidencePass
            ? OPPORTUNITY_MATURITY_WEIGHTS
                .confidence
            : Number.isFinite(confidence)
                ? Math.min(
                    OPPORTUNITY_MATURITY_WEIGHTS
                        .confidence - 1,
                    OPPORTUNITY_MATURITY_WEIGHTS
                        .confidence *
                    confidence /
                    options.minConfidence
                )
                : 0;

    const risk =
        finite(decision.risk);
    const riskPass =
        Number.isFinite(risk) &&
        risk <= options.maxRelativeRisk;

    const amount =
        finite(decision.amount, 0);
    const calculatedAmount =
        finite(
            decision.sizing
                ?.calculatedAmount,
            0
        );
    const minBet =
        finite(
            decision.sizing?.minBet,
            0
        );
    const kellyPass =
        decision.action ===
            LiveDecisionAction.BET &&
        amount > 0 &&
        (
            minBet <= 0 ||
            amount >= minBet
        );
    const kellyPartial =
        !kellyPass &&
        calculatedAmount > 0;

    const components = [
        component({
            key: "ev-evidence",
            label: "EV 證據",
            earned:
                robustPositive
                    ? 30
                    : pointPositive
                        ? 15
                        : 0,
            maximum: 30,
            passed:
                robustPositive,
            detail:
                robustPositive
                    ? "Exact EV 已穩健大於 0"
                    : pointPositive
                        ? "點估計為正，但安全門檻尚未全數通過"
                        : "主注 EV 尚未大於 0"
        }),
        component({
            key: "exact-confirmation",
            label: "Exact 確認",
            earned:
                exact
                    ? 20
                    : 0,
            maximum: 20,
            passed:
                exact,
            detail:
                exact
                    ? "同一局 Exact 已發布最終結果"
                    : "仍在等待同一局 Exact"
        }),
        component({
            key: "confidence",
            label: "可靠度",
            earned:
                confidenceEarned,
            maximum: 20,
            passed:
                confidencePass,
            detail:
                Number.isFinite(confidence)
                    ? `可靠度 ${(confidence * 100).toFixed(2)}%，門檻 ${(options.minConfidence * 100).toFixed(2)}%`
                    : "尚未取得可靠度"
        }),
        component({
            key: "risk",
            label: "風險",
            earned:
                riskPass
                    ? 15
                    : 0,
            maximum: 15,
            passed:
                riskPass,
            detail:
                Number.isFinite(risk)
                    ? `相對波動比 ${risk.toFixed(3)}，上限 ${options.maxRelativeRisk.toFixed(3)}`
                    : "尚未取得相對波動比"
        }),
        component({
            key: "kelly",
            label: "Kelly 可執行性",
            earned:
                kellyPass
                    ? 15
                    : kellyPartial
                        ? 7
                        : 0,
            maximum: 15,
            passed:
                kellyPass,
            detail:
                kellyPass
                    ? `正式建議額 ${Math.floor(amount)}`
                    : calculatedAmount > 0
                        ? `Kelly 試算 ${Math.floor(calculatedAmount)}，尚未成為正式下注額`
                        : "Kelly 尚無可執行下注額"
        })
    ];

    const missingConditions =
        components
            .filter(item =>
                !item.passed
            )
            .map(item =>
                item.detail
            );

    if (closeCall.active) {
        missingConditions.unshift(
            `閒莊 EV 差距 ${(closeCall.gap * 100).toFixed(4)}%，未超過穩定門檻 ${(closeCall.threshold * 100).toFixed(2)}%`
        );
    }

    const score =
        components.reduce(
            (total, item) =>
                total + item.earned,
            0
        );

    return {
        score,
        maximum: 100,
        label:
            score >= 85
                ? "條件成熟"
                : score >= 65
                    ? "接近成熟"
                    : score >= 45
                        ? "證據累積中"
                        : "條件不足",
        components,
        missingConditions,
        safetyNote:
            "成熟度只解釋條件完整度，不會越過 Exact、EV、風險或 Kelly 門檻強迫下注。"
    };
}


function closeCallReason(closeCall) {
    return `閒 EV ${(closeCall.playerEV * 100).toFixed(4)}%、莊 EV ${(closeCall.bankerEV * 100).toFixed(4)}%，差距 ${(closeCall.gap * 100).toFixed(4)}%；未超過 ${(closeCall.threshold * 100).toFixed(2)}% 穩定門檻，目前沒有足以區分閒莊的有效優勢。`;
}


function stableDecisionFor(
    decision,
    {
        final,
        lifecycle,
        closeCall,
        marketState,
        maturity,
        snapshot = null,
        audit = null,
        expiredReason = null
    }
) {
    const provisional =
        !final;
    const neutral =
        closeCall.active;
    const expired =
        lifecycle ===
            StableDecisionLifecycle.EXPIRED;
    const forceWait =
        provisional ||
        neutral ||
        expired;
    const finalAction =
        forceWait
            ? LiveDecisionAction.WAIT
            : decision.action ??
                LiveDecisionAction.WAIT;
    const marketLabel =
        STABLE_MARKET_STATE_LABEL[
            marketState
        ];
    const lifecycleLabel =
        STABLE_DECISION_LIFECYCLE_LABEL[
            lifecycle
        ];
    const reason =
        expired
            ? expiredReason ??
                "本局決策已失效；依安全規則維持觀望。"
            : provisional
                ? "MC 僅供背景預覽；正式決策等待同一局 Exact 最終快照。"
                : neutral
                    ? closeCallReason(closeCall)
                    : decision.reason;

    const blockers = [
        ...(
            Array.isArray(decision.blockers)
                ? decision.blockers
                : []
        )
    ];

    if (
        neutral &&
        !blockers.some(item =>
            item?.code ===
                "CLOSE_CALL_NEUTRAL_BAND"
        )
    ) {
        blockers.unshift({
            code:
                "CLOSE_CALL_NEUTRAL_BAND",
            message:
                closeCallReason(closeCall)
        });
    }

    return {
        ...decision,
        stabilityVersion:
            DECISION_STABILITY_EXPLAINABILITY_VERSION,
        lifecycle,
        lifecycleLabel,
        marketState,
        marketStateLabel:
            marketLabel,
        closeCall,
        opportunityMaturity:
            maturity,
        finalSnapshot:
            snapshot,
        decisionAudit:
            audit,
        stableDecisionFinal:
            final,
        stableDecisionProvisional:
            provisional,
        action:
            finalAction,
        actionLabel:
            finalAction ===
                LiveDecisionAction.BET
                ? "可下注"
                : "觀望",
        strictAction:
            finalAction,
        strictKey:
            finalAction ===
                LiveDecisionAction.BET
                ? decision.strictKey ??
                    decision.recommendationKey
                : null,
        strictLabel:
            finalAction ===
                LiveDecisionAction.BET
                ? decision.strictLabel
                : expired
                    ? "決策已失效：觀望"
                    : provisional
                        ? "等待 Exact 最終快照"
                        : neutral
                            ? "閒莊近似持平：觀望"
                            : decision.strictLabel,
        shouldBet:
            finalAction ===
                LiveDecisionAction.BET,
        amount:
            finalAction ===
                LiveDecisionAction.BET
                ? finite(decision.amount, 0)
                : 0,
        headlineLabel:
            expired
                ? "最終決策"
                : provisional
                    ? "分析狀態"
                    : neutral
                        ? "市場狀態"
                        : finalAction ===
                            LiveDecisionAction.BET
                            ? "最終推薦"
                            : "最終決策",
        recommendationKey:
            neutral || provisional || expired
                ? null
                : decision.recommendationKey,
        recommendationLabel:
            expired
                ? "觀望"
                : provisional
                    ? "Exact 確認中"
                    : neutral
                        ? "閒莊近似持平"
                        : finalAction ===
                            LiveDecisionAction.BET
                            ? decision.recommendationLabel
                            : "觀望",
        stableCandidateKey:
            neutral || provisional || expired
                ? null
                : decision.recommendationKey ??
                    decision.relativeKey ??
                    null,
        stableCandidateLabel:
            neutral || provisional || expired
                ? marketLabel
                : decision.recommendationLabel ??
                    decision.relativeLabel ??
                    "—",
        blockers,
        primaryBlocker:
            finalAction ===
                LiveDecisionAction.BET
                ? null
                : reason,
        reason
    };
}


export default class DecisionStabilityExplainabilityEngine {
    constructor(options = {}) {
        this.options = {
            ...DEFAULT_DECISION_STABILITY_OPTIONS,
            ...options
        };

        const {
            closeCallEVGap,
            minConfidence,
            maxRelativeRisk,
            maxAuditEntries,
            clock = () => Date.now()
        } = this.options;

        if (
            !Number.isFinite(closeCallEVGap) ||
            closeCallEVGap < 0
        ) {
            throw new RangeError(
                "closeCallEVGap must be >= 0."
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
            !Number.isFinite(maxRelativeRisk) ||
            maxRelativeRisk < 0
        ) {
            throw new RangeError(
                "maxRelativeRisk must be >= 0."
            );
        }

        if (
            !Number.isInteger(maxAuditEntries) ||
            maxAuditEntries < 1
        ) {
            throw new RangeError(
                "maxAuditEntries must be a positive integer."
            );
        }

        if (typeof clock !== "function") {
            throw new TypeError(
                "Decision stability clock must be a function."
            );
        }

        this.clock = clock;
        this.auditHistory = [];
        this.reset();
    }


    reset({ preserveAudit = false } = {}) {
        if (!preserveAudit) {
            this.auditHistory = [];
        }

        this.sequence = 0;
        this.roundId = null;
        this.shoeId = null;
        this.lifecycle =
            StableDecisionLifecycle.ANALYZING;
        this.startedAt = null;
        this.exactStartedAt = null;
        this.finalizedAt = null;
        this.provisionalDecision = null;
        this.finalDecision = null;
        this.finalSnapshot = null;
        this.currentAudit = null;
        return this.summary;
    }


    start({
        sequence = this.sequence + 1,
        roundId = null,
        shoeId = null
    } = {}) {
        if (
            this.currentAudit &&
            !this.currentAudit.finalized
        ) {
            this.archiveAudit({
                ...this.currentAudit,
                lifecycle:
                    StableDecisionLifecycle.EXPIRED,
                expiredReason:
                    "新一輪分析已開始，前一個未完成決策已失效。",
                endedAt:
                    this.clock()
            });
        }

        this.sequence = sequence;
        this.roundId =
            normalizeId(roundId);
        this.shoeId =
            normalizeId(shoeId);
        this.lifecycle =
            StableDecisionLifecycle.ANALYZING;
        this.startedAt =
            this.clock();
        this.exactStartedAt = null;
        this.finalizedAt = null;
        this.provisionalDecision = null;
        this.finalDecision = null;
        this.finalSnapshot = null;
        this.currentAudit = {
            version:
                DECISION_STABILITY_EXPLAINABILITY_VERSION,
            sequence,
            roundId:
                this.roundId,
            shoeId:
                this.shoeId,
            lifecycle:
                this.lifecycle,
            startedAt:
                this.startedAt,
            exactStartedAt: null,
            endedAt: null,
            provisional: null,
            final: null,
            candidateChanged: false,
            actionChanged: false,
            classificationChanged: false,
            blockers: [],
            maturityScore: 0,
            finalized: false
        };

        return this.summary;
    }


    matches({
        sequence = this.sequence,
        roundId = null
    } = {}) {
        if (
            sequence !== undefined &&
            sequence !== null &&
            sequence !== this.sequence
        ) {
            return false;
        }

        const normalizedRound =
            normalizeId(roundId);

        if (
            this.roundId !== null &&
            normalizedRound !== null &&
            normalizedRound !== this.roundId
        ) {
            return false;
        }

        if (
            this.roundId === null &&
            normalizedRound !== null
        ) {
            this.roundId = normalizedRound;

            if (this.currentAudit) {
                this.currentAudit.roundId =
                    normalizedRound;
            }
        }

        return true;
    }


    beginExact({
        sequence = this.sequence
    } = {}) {
        if (!this.matches({ sequence })) {
            return false;
        }

        this.lifecycle =
            StableDecisionLifecycle.EXACT_CONFIRMING;
        this.exactStartedAt =
            this.exactStartedAt ??
            this.clock();

        if (this.currentAudit) {
            this.currentAudit.lifecycle =
                this.lifecycle;
            this.currentAudit.exactStartedAt =
                this.exactStartedAt;
        }

        return true;
    }


    acceptProvisional(
        analysis,
        decision,
        {
            sequence = this.sequence,
            roundId = null
        } = {}
    ) {
        const candidateRound =
            roundIdFor(
                analysis,
                roundId
            );

        if (
            !this.matches({
                sequence,
                roundId:
                    candidateRound
            })
        ) {
            return false;
        }

        this.provisionalDecision =
            decision;
        this.beginExact({ sequence });

        const provisional =
            candidateSnapshot(decision);

        if (this.currentAudit) {
            this.currentAudit.provisional =
                provisional;
        }

        return this.decorate(
            decision,
            {
                final: false
            }
        );
    }


    acceptFinal(
        analysis,
        decision,
        {
            sequence = this.sequence,
            roundId = null,
            durationMs = null
        } = {}
    ) {
        const candidateRound =
            roundIdFor(
                analysis,
                roundId
            );

        if (
            !this.matches({
                sequence,
                roundId:
                    candidateRound
            })
        ) {
            return false;
        }

        /*
         * The first accepted same-round Exact result owns the immutable final
         * snapshot. A duplicate or late Exact completion may be observed by
         * legacy layers, but cannot rewrite the formal V10.6 decision.
         */
        if (
            this.finalSnapshot &&
            (
                this.lifecycle ===
                    StableDecisionLifecycle.FINAL_BET ||
                this.lifecycle ===
                    StableDecisionLifecycle.FINAL_WAIT
            )
        ) {
            return this.finalDecision;
        }

        const closeCall =
            closeCallFor(
                decision,
                this.options
                    .closeCallEVGap,
                true
            );
        const marketState =
            marketStateFor(
                decision,
                {
                    final: true,
                    closeCall:
                        closeCall.active
                }
            );
        const maturity =
            maturityFor(
                decision,
                {
                    exact: true,
                    closeCall,
                    options:
                        this.options
                }
            );
        const finalAction =
            closeCall.active
                ? LiveDecisionAction.WAIT
                : decision.action ??
                    LiveDecisionAction.WAIT;

        this.lifecycle =
            finalAction ===
                LiveDecisionAction.BET
                ? StableDecisionLifecycle.FINAL_BET
                : StableDecisionLifecycle.FINAL_WAIT;
        this.finalizedAt =
            this.clock();

        const provisional =
            this.currentAudit
                ?.provisional ??
            (
                this.provisionalDecision
                    ? candidateSnapshot(
                        this.provisionalDecision
                    )
                    : null
            );
        const finalCandidate =
            candidateSnapshot({
                ...decision,
                action:
                    finalAction,
                amount:
                    finalAction ===
                        LiveDecisionAction.BET
                        ? decision.amount
                        : 0
            });

        const audit = {
            ...(this.currentAudit ?? {}),
            version:
                DECISION_STABILITY_EXPLAINABILITY_VERSION,
            sequence:
                this.sequence,
            roundId:
                this.roundId,
            shoeId:
                this.shoeId,
            lifecycle:
                this.lifecycle,
            startedAt:
                this.startedAt,
            exactStartedAt:
                this.exactStartedAt,
            endedAt:
                this.finalizedAt,
            durationMs:
                Number.isFinite(durationMs)
                    ? durationMs
                    : this.startedAt === null
                        ? null
                        : Math.max(
                            0,
                            this.finalizedAt -
                            this.startedAt
                        ),
            provisional,
            final:
                finalCandidate,
            candidateChanged:
                Boolean(
                    provisional &&
                    provisional.key !==
                        finalCandidate.key
                ),
            actionChanged:
                Boolean(
                    provisional &&
                    provisional.action !==
                        finalAction
                ),
            classificationChanged:
                Boolean(
                    provisional &&
                    provisional.category !==
                        finalCandidate.category
                ),
            marketState,
            closeCall:
                copy(closeCall),
            blockers:
                blockerCodes(decision),
            maturityScore:
                maturity.score,
            finalAmount:
                finalAction ===
                    LiveDecisionAction.BET
                    ? finite(decision.amount, 0)
                    : 0,
            reason:
                closeCall.active
                    ? closeCallReason(closeCall)
                    : decision.reason,
            finalized: true
        };

        const snapshot =
            deepFreeze({
                version:
                    DECISION_STABILITY_EXPLAINABILITY_VERSION,
                snapshotId:
                    `${this.shoeId ?? "shoe"}:${this.roundId ?? this.sequence}:${this.finalizedAt}`,
                sequence:
                    this.sequence,
                shoeId:
                    this.shoeId,
                roundId:
                    this.roundId,
                createdAt:
                    this.finalizedAt,
                lifecycle:
                    this.lifecycle,
                lifecycleLabel:
                    STABLE_DECISION_LIFECYCLE_LABEL[
                        this.lifecycle
                    ],
                action:
                    finalAction,
                marketState,
                marketStateLabel:
                    STABLE_MARKET_STATE_LABEL[
                        marketState
                    ],
                recommendation: {
                    key:
                        closeCall.active
                            ? null
                            : finalCandidate.key,
                    label:
                        closeCall.active
                            ? "閒莊近似持平"
                            : finalCandidate.label
                },
                amount:
                    audit.finalAmount,
                exactEV: {
                    player:
                        finite(decision.ev?.player),
                    banker:
                        finite(decision.ev?.banker),
                    tie:
                        finite(decision.ev?.tie)
                },
                playerBankerGap:
                    closeCall.gap,
                closeCall:
                    copy(closeCall),
                maturity:
                    copy(maturity),
                blockerCodes:
                    blockerCodes(decision),
                reason:
                    audit.reason,
                immutable: true
            });

        const stable =
            stableDecisionFor(
                decision,
                {
                    final: true,
                    lifecycle:
                        this.lifecycle,
                    closeCall,
                    marketState,
                    maturity,
                    snapshot,
                    audit:
                        deepFreeze(
                            copy(audit)
                        )
                }
            );

        this.finalDecision =
            stable;
        this.finalSnapshot =
            snapshot;
        this.currentAudit =
            audit;
        this.archiveAudit(audit);

        return stable;
    }


    expire(
        decision,
        {
            sequence = this.sequence,
            reason = null
        } = {}
    ) {
        if (!this.matches({ sequence })) {
            return false;
        }

        this.lifecycle =
            StableDecisionLifecycle.EXPIRED;

        const stable =
            this.decorate(
                decision,
                {
                    final: false,
                    lifecycle:
                        this.lifecycle,
                    expiredReason:
                        reason
                }
            );

        const audit = {
            ...(this.currentAudit ?? {}),
            version:
                DECISION_STABILITY_EXPLAINABILITY_VERSION,
            sequence:
                this.sequence,
            roundId:
                this.roundId,
            shoeId:
                this.shoeId,
            lifecycle:
                this.lifecycle,
            endedAt:
                this.clock(),
            expiredReason:
                reason ??
                stable.reason,
            finalAmount: 0,
            finalized: false
        };

        this.currentAudit =
            audit;
        this.archiveAudit(audit);

        return stable;
    }


    decorate(
        decision,
        {
            final = false,
            lifecycle = null,
            expiredReason = null
        } = {}
    ) {
        if (!decision) {
            return decision;
        }

        const targetLifecycle =
            lifecycle ??
            (
                final
                    ? this.lifecycle
                    : this.lifecycle ===
                        StableDecisionLifecycle.ANALYZING
                        ? StableDecisionLifecycle.ANALYZING
                        : StableDecisionLifecycle.EXACT_CONFIRMING
            );
        const expired =
            targetLifecycle ===
                StableDecisionLifecycle.EXPIRED;
        const closeCall =
            closeCallFor(
                decision,
                this.options
                    .closeCallEVGap,
                final && !expired
            );
        const marketState =
            expired
                ? StableMarketState.EXPIRED
                : marketStateFor(
                    decision,
                    {
                        final,
                        closeCall:
                            closeCall.active
                    }
                );
        const maturity =
            maturityFor(
                decision,
                {
                    exact:
                        final && !expired,
                    closeCall,
                    options:
                        this.options
                }
            );

        return stableDecisionFor(
            decision,
            {
                final:
                    final && !expired,
                lifecycle:
                    targetLifecycle,
                closeCall,
                marketState,
                maturity,
                snapshot:
                    final
                        ? this.finalSnapshot
                        : null,
                audit:
                    this.currentAudit
                        ? deepFreeze(
                            copy(
                                this.currentAudit
                            )
                        )
                        : null,
                expiredReason
            }
        );
    }


    archiveAudit(audit) {
        const frozen =
            deepFreeze(
                copy(audit)
            );
        const index =
            this.auditHistory
                .findIndex(item =>
                    item.sequence ===
                        frozen.sequence &&
                    item.roundId ===
                        frozen.roundId
                );

        if (index >= 0) {
            this.auditHistory[index] =
                frozen;
        }
        else {
            this.auditHistory.push(
                frozen
            );
        }

        if (
            this.auditHistory.length >
                this.options.maxAuditEntries
        ) {
            this.auditHistory.splice(
                0,
                this.auditHistory.length -
                    this.options.maxAuditEntries
            );
        }
    }


    getAuditTrail() {
        return [
            ...this.auditHistory
        ];
    }


    get summary() {
        return {
            version:
                DECISION_STABILITY_EXPLAINABILITY_VERSION,
            lifecycle:
                this.lifecycle,
            lifecycleLabel:
                STABLE_DECISION_LIFECYCLE_LABEL[
                    this.lifecycle
                ],
            sequence:
                this.sequence,
            roundId:
                this.roundId,
            shoeId:
                this.shoeId,
            final:
                this.lifecycle ===
                    StableDecisionLifecycle.FINAL_BET ||
                this.lifecycle ===
                    StableDecisionLifecycle.FINAL_WAIT,
            actionable:
                this.lifecycle ===
                    StableDecisionLifecycle.FINAL_BET,
            closeCallEVGap:
                this.options
                    .closeCallEVGap,
            maturityWeights: {
                ...OPPORTUNITY_MATURITY_WEIGHTS
            },
            finalSnapshot:
                this.finalSnapshot,
            currentAudit:
                this.currentAudit
                    ? deepFreeze(
                        copy(
                            this.currentAudit
                        )
                    )
                    : null,
            auditCount:
                this.auditHistory.length
        };
    }
}
