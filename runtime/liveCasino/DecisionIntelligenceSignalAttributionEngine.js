/**
 * Baccarat Analyzer V10.7.0
 * Path: runtime/liveCasino/DecisionIntelligenceSignalAttributionEngine.js
 *
 * Converts the locked V10.6 decision into one plain-language source of truth.
 * It never recalculates probability, EV, risk, Kelly, action, amount, or side.
 * Its only responsibilities are:
 * - identify which result is authoritative;
 * - separate result confirmation, opportunity strength, and execution gates;
 * - attribute MC -> Exact changes;
 * - quantify why a final decision is BET or WAIT.
 */

import {
    LiveDecisionAction
} from "./AILiveDecisionEngine.js";


export const DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_VERSION =
    "10.7.0";


export const DecisionAuthority = Object.freeze({
    WAITING: "waiting",
    PROVISIONAL_MC: "provisional-mc",
    FINAL_EXACT: "final-exact",
    EXPIRED: "expired"
});


export const DECISION_AUTHORITY_LABEL = Object.freeze({
    [DecisionAuthority.WAITING]:
        "等待本局分析",
    [DecisionAuthority.PROVISIONAL_MC]:
        "MC 暫定預覽",
    [DecisionAuthority.FINAL_EXACT]:
        "Exact 唯一正式結果",
    [DecisionAuthority.EXPIRED]:
        "本局結果已失效"
});


export const SignalAttributionType = Object.freeze({
    WAITING_EXACT: "waiting-exact",
    FALSE_POSITIVE_REJECTED:
        "false-positive-rejected",
    OPPORTUNITY_CONFIRMED:
        "opportunity-confirmed",
    CANDIDATE_CHANGED:
        "candidate-changed",
    ACTION_CHANGED:
        "action-changed",
    ESTIMATE_REVISED:
        "estimate-revised",
    EXACT_FINALIZED:
        "exact-finalized",
    UNCHANGED:
        "unchanged"
});


export const SIGNAL_ATTRIBUTION_TYPE_LABEL = Object.freeze({
    [SignalAttributionType.WAITING_EXACT]:
        "等待 Exact 最終歸因",
    [SignalAttributionType.FALSE_POSITIVE_REJECTED]:
        "Exact 已否決 MC 暫定正 EV",
    [SignalAttributionType.OPPORTUNITY_CONFIRMED]:
        "Exact 已確認正式機會",
    [SignalAttributionType.CANDIDATE_CHANGED]:
        "Exact 已更換相對領先方",
    [SignalAttributionType.ACTION_CHANGED]:
        "Exact 已修正正式策略",
    [SignalAttributionType.ESTIMATE_REVISED]:
        "Exact 已修正 MC 估計",
    [SignalAttributionType.EXACT_FINALIZED]:
        "Exact 已發布唯一正式結果",
    [SignalAttributionType.UNCHANGED]:
        "MC 與 Exact 方向一致"
});


export const EXECUTION_READINESS_WEIGHTS = Object.freeze({
    exact: 20,
    stableSeparation: 10,
    robustPositiveEV: 25,
    confidence: 15,
    risk: 15,
    kelly: 15
});


export const OPPORTUNITY_STRENGTH_WEIGHTS = Object.freeze({
    positiveEV: 35,
    robustPositiveEV: 25,
    stableSeparation: 10,
    confidence: 10,
    risk: 10,
    kellyPotential: 10
});


export const DEFAULT_DECISION_INTELLIGENCE_OPTIONS = Object.freeze({
    minConfidence: 0.70,
    maxRelativeRisk: 1.05,
    revisionTolerance: 0.0001
});


function finite(value, fallback = null) {
    return Number.isFinite(value)
        ? value
        : fallback;
}


function clamp(value, min = 0, max = 100) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}


function pct(value, digits = 2) {
    return Number.isFinite(value)
        ? `${value >= 0 ? "+" : ""}${(value * 100).toFixed(digits)}%`
        : "—";
}


function gapPct(value, digits = 2) {
    return Number.isFinite(value)
        ? `${(Math.abs(value) * 100).toFixed(digits)}%`
        : "—";
}


function copy(value) {
    if (value === undefined) {
        return undefined;
    }

    return JSON.parse(
        JSON.stringify(value)
    );
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


function selectedKeyFor(decision = {}) {
    const key =
        decision.strictKey ??
        decision.recommendationKey ??
        decision.relativeKey ??
        decision.decisionAudit?.final?.key ??
        null;

    return key === "player" ||
        key === "banker"
        ? key
        : null;
}


function labelForKey(key) {
    switch (key) {
    case "player":
        return "閒家";
    case "banker":
        return "莊家";
    case "tie":
        return "和局";
    default:
        return "主注";
    }
}


function candidateFor(decision = {}) {
    const key =
        selectedKeyFor(decision);

    return {
        key,
        label:
            key
                ? labelForKey(key)
                : decision.recommendationLabel ??
                    decision.marketStateLabel ??
                    "—",
        ev:
            key
                ? finite(
                    decision.ev?.[key]
                )
                : null,
        action:
            decision.action ??
            LiveDecisionAction.WAIT,
        amount:
            finite(decision.amount, 0)
    };
}


function authorityFor(decision = {}) {
    if (
        decision.lifecycle === "expired" ||
        decision.marketState === "expired"
    ) {
        return DecisionAuthority.EXPIRED;
    }

    if (
        decision.stableDecisionFinal === true &&
        decision.finalSnapshot
    ) {
        return DecisionAuthority.FINAL_EXACT;
    }

    if (decision.ready) {
        return DecisionAuthority.PROVISIONAL_MC;
    }

    return DecisionAuthority.WAITING;
}


function confirmationScoreFor(
    authority,
    confirmation = {}
) {
    let score = 0;
    let label = "尚未開始";
    let detail =
        "目前尚未形成可使用的下一局結果。";

    if (
        authority ===
            DecisionAuthority.FINAL_EXACT
    ) {
        score = 100;
        label = "Exact 已確認";
        detail =
            "同一局 Exact 已完成並鎖定唯一正式快照。";
    }
    else if (
        authority ===
            DecisionAuthority.EXPIRED
    ) {
        label = "結果已失效";
        detail =
            "本局結果不可再用於下一局決策。";
    }
    else {
        switch (confirmation.state) {
        case "confirming":
            score = 70;
            label = "Exact 確認中";
            detail =
                "已有 MC 預覽，正在等待同一局 Exact 最終結果。";
            break;
        case "provisional":
            score = 40;
            label = "只有 MC 暫定結果";
            detail =
                "MC 可供觀察，但尚不是正式下注依據。";
            break;
        case "quick-running":
            score = 15;
            label = "快速估算中";
            detail =
                "MC 尚在建立暫定候選。";
            break;
        case "failed":
            label = "Exact 未完成";
            detail =
                "Exact 未完成，安全鎖定為觀望。";
            break;
        default:
            break;
        }
    }

    return {
        score,
        maximum: 100,
        label,
        detail,
        isWinProbability: false,
        caution:
            "結果確認度代表計算流程是否完成，不是下一局勝率。"
    };
}


function gate({
    key,
    label,
    weight,
    passed,
    detail,
    remaining = null
}) {
    return {
        key,
        label,
        weight,
        passed:
            Boolean(passed),
        earned:
            passed
                ? weight
                : 0,
        detail,
        remaining
    };
}


function evidenceValues(
    decision,
    options
) {
    const candidate =
        candidateFor(decision);
    const selectedEV =
        candidate.ev;
    const pointPositive =
        Number.isFinite(selectedEV) &&
        selectedEV > 0;
    const robustPositive =
        decision.evidence
            ?.robustPositiveEV === true;
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
    const risk =
        finite(decision.risk);
    const riskPass =
        Number.isFinite(risk) &&
        risk <=
            options.maxRelativeRisk;
    const calculatedAmount =
        finite(
            decision.sizing
                ?.calculatedAmount,
            0
        );
    const formalAmount =
        finite(decision.amount, 0);
    const kellyPotential =
        calculatedAmount > 0 ||
        formalAmount > 0;
    const kellyExecutable =
        decision.action ===
            LiveDecisionAction.BET &&
        formalAmount > 0;
    const closeCall =
        decision.closeCall?.active === true;
    const stableSeparation =
        decision.stableDecisionFinal === true &&
        !closeCall &&
        Number.isFinite(
            decision.closeCall?.gap
        ) &&
        Number.isFinite(
            decision.closeCall?.threshold
        ) &&
        decision.closeCall.gap >
            decision.closeCall.threshold;

    return {
        candidate,
        selectedEV,
        pointPositive,
        robustPositive,
        confidence,
        confidencePass,
        risk,
        riskPass,
        calculatedAmount,
        formalAmount,
        kellyPotential,
        kellyExecutable,
        closeCall,
        stableSeparation
    };
}


function executionReadinessFor(
    decision,
    values,
    authority,
    options
) {
    const exact =
        authority ===
            DecisionAuthority.FINAL_EXACT;
    const evDistance =
        Number.isFinite(
            values.selectedEV
        )
            ? Math.max(
                0,
                -values.selectedEV
            )
            : null;
    const confidenceDistance =
        Number.isFinite(
            values.confidence
        )
            ? Math.max(
                0,
                options.minConfidence -
                    values.confidence
            )
            : null;
    const riskExcess =
        Number.isFinite(values.risk)
            ? Math.max(
                0,
                values.risk -
                    options.maxRelativeRisk
            )
            : null;
    const separationGap =
        finite(
            decision.closeCall?.gap
        );
    const separationThreshold =
        finite(
            decision.closeCall
                ?.threshold
        );
    const separationRemaining =
        Number.isFinite(separationGap) &&
        Number.isFinite(
            separationThreshold
        )
            ? Math.max(
                0,
                separationThreshold -
                    separationGap
            )
            : null;

    const gates = [
        gate({
            key: "exact",
            label: "Exact 正式結果",
            weight:
                EXECUTION_READINESS_WEIGHTS
                    .exact,
            passed:
                exact,
            detail:
                exact
                    ? "同一局 Exact 已鎖定"
                    : "仍需等待同一局 Exact",
            remaining:
                exact
                    ? null
                    : "等待 Exact 完成"
        }),
        gate({
            key: "stable-separation",
            label: "閒莊差距穩定",
            weight:
                EXECUTION_READINESS_WEIGHTS
                    .stableSeparation,
            passed:
                values.stableSeparation,
            detail:
                values.closeCall
                    ? `閒莊差距 ${gapPct(separationGap, 4)} 未超過 ${gapPct(separationThreshold, 4)} 穩定門檻`
                    : values.stableSeparation
                        ? "閒莊差距已超過穩定門檻"
                        : "尚未取得可判定的閒莊差距",
            remaining:
                values.closeCall &&
                Number.isFinite(
                    separationRemaining
                )
                    ? `閒莊差距仍需擴大 ${gapPct(separationRemaining, 4)}`
                    : null
        }),
        gate({
            key: "robust-positive-ev",
            label: "穩健正 EV",
            weight:
                EXECUTION_READINESS_WEIGHTS
                    .robustPositiveEV,
            passed:
                values.robustPositive,
            detail:
                values.robustPositive
                    ? "Exact EV 與安全下界均大於 0"
                    : values.pointPositive
                        ? "Exact 點估計為正，但安全下界尚未大於 0"
                        : Number.isFinite(
                            values.selectedEV
                        )
                            ? `主注 Exact EV ${pct(values.selectedEV)}，尚未大於 0`
                            : "尚未取得主注 Exact EV",
            remaining:
                !values.pointPositive &&
                Number.isFinite(evDistance)
                    ? `主注 EV 至少需改善 ${gapPct(evDistance)} 才到 0`
                    : values.pointPositive &&
                        !values.robustPositive
                        ? "安全下界仍需大於 0"
                        : null
        }),
        gate({
            key: "confidence",
            label: "模型證據",
            weight:
                EXECUTION_READINESS_WEIGHTS
                    .confidence,
            passed:
                values.confidencePass,
            detail:
                Number.isFinite(
                    values.confidence
                )
                    ? `模型證據 ${(values.confidence * 100).toFixed(2)}%，門檻 ${(options.minConfidence * 100).toFixed(2)}%`
                    : "尚未取得模型證據",
            remaining:
                !values.confidencePass &&
                Number.isFinite(
                    confidenceDistance
                )
                    ? `模型證據仍需提升 ${(confidenceDistance * 100).toFixed(2)}%`
                    : null
        }),
        gate({
            key: "risk",
            label: "波動風險",
            weight:
                EXECUTION_READINESS_WEIGHTS
                    .risk,
            passed:
                values.riskPass,
            detail:
                Number.isFinite(values.risk)
                    ? `相對波動比 ${values.risk.toFixed(3)}，上限 ${options.maxRelativeRisk.toFixed(3)}`
                    : "尚未取得相對波動比",
            remaining:
                !values.riskPass &&
                Number.isFinite(riskExcess)
                    ? `相對波動比仍需下降 ${riskExcess.toFixed(3)}`
                    : null
        }),
        gate({
            key: "kelly",
            label: "Kelly 可執行額",
            weight:
                EXECUTION_READINESS_WEIGHTS
                    .kelly,
            passed:
                values.kellyExecutable,
            detail:
                values.kellyExecutable
                    ? `正式建議額 ${Math.floor(values.formalAmount)}`
                    : values.kellyPotential
                        ? `Kelly 試算 ${Math.floor(values.calculatedAmount)}，尚未成為正式建議額`
                        : "Kelly 尚未產生可執行下注額",
            remaining:
                values.kellyExecutable
                    ? null
                    : "Kelly 尚未形成正式可執行額"
        })
    ];

    const score =
        gates.reduce(
            (total, item) =>
                total + item.earned,
            0
        );
    const passedGateCount =
        gates.filter(item =>
            item.passed
        ).length;
    const remainingConditions =
        gates
            .filter(item =>
                !item.passed
            )
            .map(item =>
                item.remaining ??
                item.detail
            );

    return {
        score,
        maximum: 100,
        passedGateCount,
        totalGateCount:
            gates.length,
        label:
            decision.action ===
                LiveDecisionAction.BET
                ? "正式可執行"
                : exact
                    ? "正式門檻未齊"
                    : "等待 Exact",
        gates,
        remainingConditions,
        executable:
            decision.action ===
                LiveDecisionAction.BET &&
            values.formalAmount > 0
    };
}


function opportunityStrengthFor(
    decision,
    values,
    authority
) {
    const components = [
        {
            key: "positive-ev",
            label: "正 EV 方向",
            earned:
                values.pointPositive
                    ? OPPORTUNITY_STRENGTH_WEIGHTS
                        .positiveEV
                    : 0,
            maximum:
                OPPORTUNITY_STRENGTH_WEIGHTS
                    .positiveEV,
            passed:
                values.pointPositive
        },
        {
            key: "robust-positive-ev",
            label: "正 EV 安全下界",
            earned:
                values.robustPositive
                    ? OPPORTUNITY_STRENGTH_WEIGHTS
                        .robustPositiveEV
                    : 0,
            maximum:
                OPPORTUNITY_STRENGTH_WEIGHTS
                    .robustPositiveEV,
            passed:
                values.robustPositive
        },
        {
            key: "stable-separation",
            label: "主注差距",
            earned:
                values.stableSeparation
                    ? OPPORTUNITY_STRENGTH_WEIGHTS
                        .stableSeparation
                    : 0,
            maximum:
                OPPORTUNITY_STRENGTH_WEIGHTS
                    .stableSeparation,
            passed:
                values.stableSeparation
        },
        {
            key: "confidence",
            label: "模型證據",
            earned:
                values.confidencePass
                    ? OPPORTUNITY_STRENGTH_WEIGHTS
                        .confidence
                    : 0,
            maximum:
                OPPORTUNITY_STRENGTH_WEIGHTS
                    .confidence,
            passed:
                values.confidencePass
        },
        {
            key: "risk",
            label: "風險可接受",
            earned:
                values.riskPass
                    ? OPPORTUNITY_STRENGTH_WEIGHTS
                        .risk
                    : 0,
            maximum:
                OPPORTUNITY_STRENGTH_WEIGHTS
                    .risk,
            passed:
                values.riskPass
        },
        {
            key: "kelly-potential",
            label: "Kelly 潛力",
            earned:
                values.kellyPotential
                    ? OPPORTUNITY_STRENGTH_WEIGHTS
                        .kellyPotential
                    : 0,
            maximum:
                OPPORTUNITY_STRENGTH_WEIGHTS
                    .kellyPotential,
            passed:
                values.kellyPotential
        }
    ];

    let score =
        components.reduce(
            (total, item) =>
                total + item.earned,
            0
        );

    if (!values.pointPositive) {
        score = Math.min(score, 39);
    }

    if (
        values.pointPositive &&
        !values.robustPositive
    ) {
        score = Math.min(score, 79);
    }

    if (
        authority !==
            DecisionAuthority.FINAL_EXACT
    ) {
        score = Math.min(score, 49);
    }

    score = clamp(
        Math.round(score)
    );

    let label;

    if (
        authority !==
            DecisionAuthority.FINAL_EXACT
    ) {
        label = "暫定，不可下注";
    }
    else if (
        decision.action ===
            LiveDecisionAction.BET
    ) {
        label = "已確認正式機會";
    }
    else if (!values.pointPositive) {
        label =
            decision.marketState ===
                "relative-leader"
                ? "低：只有相對領先"
                : "無正 EV 優勢";
    }
    else if (!values.robustPositive) {
        label = "正 EV 候選，證據未齊";
    }
    else if (!values.riskPass) {
        label = "正 EV，但風險阻擋";
    }
    else {
        label = "正 EV，但執行門檻未齊";
    }

    return {
        score,
        maximum: 100,
        label,
        components,
        formal:
            authority ===
                DecisionAuthority.FINAL_EXACT,
        caution:
            "機會強度用於解釋訊號，不會改寫正式 action 或建議額。"
    };
}


function normalizedComparison(
    decision,
    confirmation
) {
    const comparison =
        confirmation?.comparison ??
        null;
    const audit =
        decision.decisionAudit ??
        null;
    const provisional =
        comparison?.provisional ??
        audit?.provisional ??
        null;
    const final =
        comparison?.final ??
        audit?.final ??
        candidateFor(decision);

    return {
        provisional:
            provisional
                ? copy(provisional)
                : null,
        final:
            final
                ? copy(final)
                : null,
        candidateChanged:
            comparison
                ?.candidateChanged ??
            audit?.candidateChanged ??
            Boolean(
                provisional &&
                final &&
                provisional.key !==
                    final.key
            ),
        actionChanged:
            comparison?.actionChanged ??
            audit?.actionChanged ??
            Boolean(
                provisional &&
                final &&
                provisional.action !==
                    final.action
            ),
        deltaEV:
            finite(
                comparison?.deltaEV,
                provisional &&
                final &&
                provisional.key ===
                    final.key &&
                Number.isFinite(
                    provisional.ev
                ) &&
                Number.isFinite(
                    final.ev
                )
                    ? final.ev -
                        provisional.ev
                    : null
            )
    };
}


function signalAttributionFor(
    decision,
    confirmation,
    authority,
    options
) {
    const comparison =
        normalizedComparison(
            decision,
            confirmation
        );
    const provisional =
        comparison.provisional;
    const final =
        comparison.final;
    const exactFinal =
        authority ===
            DecisionAuthority.FINAL_EXACT;
    let type =
        SignalAttributionType
            .WAITING_EXACT;

    if (exactFinal) {
        const falsePositive =
            Number.isFinite(
                provisional?.ev
            ) &&
            provisional.ev > 0 &&
            decision.action !==
                LiveDecisionAction.BET;

        if (falsePositive) {
            type =
                SignalAttributionType
                    .FALSE_POSITIVE_REJECTED;
        }
        else if (
            decision.action ===
                LiveDecisionAction.BET
        ) {
            type =
                SignalAttributionType
                    .OPPORTUNITY_CONFIRMED;
        }
        else if (
            comparison.candidateChanged
        ) {
            type =
                SignalAttributionType
                    .CANDIDATE_CHANGED;
        }
        else if (
            comparison.actionChanged
        ) {
            type =
                SignalAttributionType
                    .ACTION_CHANGED;
        }
        else if (
            Number.isFinite(
                comparison.deltaEV
            ) &&
            Math.abs(
                comparison.deltaEV
            ) >=
                options.revisionTolerance
        ) {
            type =
                SignalAttributionType
                    .ESTIMATE_REVISED;
        }
        else if (provisional) {
            type =
                SignalAttributionType
                    .UNCHANGED;
        }
        else {
            type =
                SignalAttributionType
                    .EXACT_FINALIZED;
        }
    }

    const headline =
        SIGNAL_ATTRIBUTION_TYPE_LABEL[
            type
        ];
    const fromText =
        provisional
            ? `${provisional.label ?? labelForKey(provisional.key)} ${pct(provisional.ev)}`
            : null;
    const toText =
        final
            ? `${final.label ?? labelForKey(final.key)} ${pct(final.ev)}`
            : null;
    let summary;

    if (!exactFinal) {
        summary =
            provisional
                ? `暫定 MC ${fromText}；正式結果仍等待 Exact。`
                : "目前尚無可歸因的 MC → Exact 結果。";
    }
    else if (provisional && final) {
        summary =
            `MC ${fromText} → Exact ${toText}；正式${decision.action === LiveDecisionAction.BET ? "可下注" : "維持觀望"}。`;
    }
    else {
        summary =
            `Exact ${toText ?? "已完成"}；正式${decision.action === LiveDecisionAction.BET ? "可下注" : "維持觀望"}。`;
    }

    return {
        type,
        label:
            headline,
        headline,
        summary,
        changed:
            type !==
                SignalAttributionType.UNCHANGED &&
            type !==
                SignalAttributionType.EXACT_FINALIZED &&
            type !==
                SignalAttributionType.WAITING_EXACT,
        from:
            provisional,
        to:
            final,
        deltaEV:
            comparison.deltaEV,
        candidateChanged:
            comparison.candidateChanged,
        actionChanged:
            comparison.actionChanged,
        formal:
            exactFinal
    };
}


function explanationFor(
    decision,
    values,
    authority,
    readiness,
    attribution
) {
    const final =
        authority ===
            DecisionAuthority.FINAL_EXACT;
    const candidateLabel =
        values.candidate.label;
    let primary;

    if (!final) {
        primary =
            "目前只是 MC 暫定預覽；正式決策必須等待同一局 Exact。";
    }
    else if (
        decision.action ===
            LiveDecisionAction.BET
    ) {
        primary =
            `${candidateLabel}已通過 Exact、穩健正 EV、模型證據、風險與 Kelly 正式門檻。`;
    }
    else if (values.closeCall) {
        primary =
            "閒莊 Exact EV 過於接近，沒有足夠穩定差距可硬選一方。";
    }
    else if (
        Number.isFinite(
            values.selectedEV
        ) &&
        values.selectedEV <= 0
    ) {
        primary =
            decision.marketState ===
                "relative-leader"
                ? `${candidateLabel}只是目前虧損較少，Exact EV ${pct(values.selectedEV)} 仍為負值，沒有下注優勢。`
                : `目前最佳主注 Exact EV ${pct(values.selectedEV)} 仍為負值，沒有下注優勢。`;
    }
    else if (!values.robustPositive) {
        primary =
            `${candidateLabel}雖為正 EV 點估計，但安全下界尚未大於 0。`;
    }
    else if (!values.riskPass) {
        primary =
            `${candidateLabel}具正 EV 證據，但相對波動比 ${values.risk?.toFixed(3) ?? "—"} 超過安全上限。`;
    }
    else if (!values.kellyExecutable) {
        primary =
            `${candidateLabel}尚未產生可執行的 Kelly 正式建議額。`;
    }
    else {
        primary =
            decision.primaryBlocker ??
            decision.reason ??
            "正式下注門檻尚未全部通過。";
    }

    const nextRequirement =
        readiness.executable
            ? "所有正式安全門檻已通過。"
            : readiness.remainingConditions
                .slice(0, 3)
                .join("；") ||
                "等待下一份完整 Exact 證據。";

    return {
        primary,
        short:
            primary,
        nextRequirement,
        attribution:
            attribution.summary,
        decisionLine:
            !final
                ? "暫定預覽｜正式結果等待 Exact"
                : decision.action ===
                    LiveDecisionAction.BET
                    ? `正式可下注｜${candidateLabel}｜建議額 ${Math.floor(values.formalAmount)}`
                    : `正式觀望｜${decision.marketStateLabel ?? decision.categoryLabel ?? "門檻未齊"}`,
        safetyLine:
            "V10.7 只解釋 V10.6 唯一正式快照，不會改寫 EV、action、推薦方或建議額。"
    };
}


export default class DecisionIntelligenceSignalAttributionEngine {
    constructor(options = {}) {
        this.options = {
            ...DEFAULT_DECISION_INTELLIGENCE_OPTIONS,
            ...options
        };

        const {
            minConfidence,
            maxRelativeRisk,
            revisionTolerance
        } = this.options;

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
            !Number.isFinite(revisionTolerance) ||
            revisionTolerance < 0
        ) {
            throw new RangeError(
                "revisionTolerance must be >= 0."
            );
        }
    }


    explain(
        decision,
        {
            confirmation = {},
            trend = {}
        } = {}
    ) {
        if (!decision) {
            return decision;
        }

        const authority =
            authorityFor(decision);
        const values =
            evidenceValues(
                decision,
                this.options
            );
        const resultConfirmation =
            confirmationScoreFor(
                authority,
                confirmation
            );
        const executionReadiness =
            executionReadinessFor(
                decision,
                values,
                authority,
                this.options
            );
        const opportunityStrength =
            opportunityStrengthFor(
                decision,
                values,
                authority
            );
        const signalAttribution =
            signalAttributionFor(
                decision,
                confirmation,
                authority,
                this.options
            );
        const explanation =
            explanationFor(
                decision,
                values,
                authority,
                executionReadiness,
                signalAttribution
            );
        const snapshotId =
            decision.finalSnapshot
                ?.snapshotId ??
            null;
        const canonical = {
            authority,
            authorityLabel:
                DECISION_AUTHORITY_LABEL[
                    authority
                ],
            formal:
                authority ===
                    DecisionAuthority.FINAL_EXACT,
            locked:
                Boolean(snapshotId),
            snapshotId,
            lifecycle:
                decision.lifecycle ??
                null,
            source:
                authority ===
                    DecisionAuthority.FINAL_EXACT
                    ? "Exact"
                    : authority ===
                        DecisionAuthority.PROVISIONAL_MC
                        ? "Monte Carlo"
                        : "—",
            action:
                decision.action ??
                LiveDecisionAction.WAIT,
            recommendationLabel:
                decision.recommendationLabel ??
                "觀望",
            amount:
                finite(decision.amount, 0),
            reason:
                explanation.primary
        };
        const thresholds = {
            selectedKey:
                values.candidate.key,
            selectedLabel:
                values.candidate.label,
            selectedEV:
                values.selectedEV,
            distanceToPositiveEV:
                Number.isFinite(
                    values.selectedEV
                )
                    ? Math.max(
                        0,
                        -values.selectedEV
                    )
                    : null,
            playerBankerGap:
                finite(
                    decision.closeCall?.gap
                ),
            stableGapThreshold:
                finite(
                    decision.closeCall
                        ?.threshold
                ),
            confidence:
                values.confidence,
            minConfidence:
                this.options.minConfidence,
            relativeRisk:
                values.risk,
            maxRelativeRisk:
                this.options.maxRelativeRisk,
            calculatedKellyAmount:
                values.calculatedAmount,
            formalAmount:
                values.formalAmount
        };
        const intelligence =
            deepFreeze({
                version:
                    DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_VERSION,
                canonical,
                resultConfirmation,
                opportunityStrength,
                executionReadiness,
                signalAttribution,
                thresholds,
                explanation,
                trendContext: {
                    ready:
                        trend.ready === true,
                    targetKey:
                        trend.targetKey ??
                        null,
                    direction:
                        trend.direction ??
                        null,
                    opportunityState:
                        trend.opportunityState ??
                        null
                },
                sourceOfTruth:
                    snapshotId
                        ? "decision.finalSnapshot"
                        : "provisional-decision",
                safetyContract: {
                    changesDecision: false,
                    exactOnlyFormalBet: true,
                    negativeEVCanBet: false,
                    scoreCanForceBet: false
                }
            });

        return {
            ...decision,
            decisionIntelligenceVersion:
                DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_VERSION,
            decisionIntelligence:
                intelligence,
            canonicalDecision:
                intelligence.canonical,
            signalAttribution:
                intelligence.signalAttribution,
            authoritativeSnapshot:
                decision.finalSnapshot ??
                null
        };
    }


    get summary() {
        return {
            version:
                DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_VERSION,
            executionReadinessWeights: {
                ...EXECUTION_READINESS_WEIGHTS
            },
            opportunityStrengthWeights: {
                ...OPPORTUNITY_STRENGTH_WEIGHTS
            },
            minConfidence:
                this.options.minConfidence,
            maxRelativeRisk:
                this.options.maxRelativeRisk,
            revisionTolerance:
                this.options.revisionTolerance,
            changesDecision: false
        };
    }
}
