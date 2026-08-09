/**
 * Baccarat Analyzer V10.5.4
 * Path: runtime/liveCasino/ExactOpportunityConfirmation.js
 *
 * Owns the Quick MC -> Exact lifecycle. A Monte Carlo result may describe a
 * provisional candidate, but only a same-round Exact result is final and may
 * carry an actionable amount.
 */

import {
    LiveDecisionAction
} from "./AILiveDecisionEngine.js";


export const EXACT_OPPORTUNITY_CONFIRMATION_VERSION =
    "10.5.4";


export const ExactOpportunityState = Object.freeze({
    IDLE: "idle",
    QUICK_RUNNING: "quick-running",
    PROVISIONAL: "provisional",
    CONFIRMING: "confirming",
    CONFIRMED: "confirmed",
    FAILED: "failed"
});


export const EXACT_OPPORTUNITY_STATE_LABEL = Object.freeze({
    [ExactOpportunityState.IDLE]:
        "等待分析",
    [ExactOpportunityState.QUICK_RUNNING]:
        "快速估算中",
    [ExactOpportunityState.PROVISIONAL]:
        "暫定快速估算",
    [ExactOpportunityState.CONFIRMING]:
        "Exact 精算確認中",
    [ExactOpportunityState.CONFIRMED]:
        "最終精算結果",
    [ExactOpportunityState.FAILED]:
        "Exact 精算失敗"
});


function normalizeMethod(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replaceAll("-", "");
}


export function isExactOpportunityAnalysis(
    analysis
) {
    const method =
        normalizeMethod(
            analysis?.method
        );

    return Boolean(analysis?.exact) &&
        (
            method === "exact" ||
            method === "hybrid"
        );
}


function roundIdFor(
    analysis,
    fallback = null
) {
    const value =
        analysis?.generatedAfterRound ??
        analysis?.roundNumber ??
        fallback;

    return value === null ||
        value === undefined
        ? null
        : String(value);
}


function candidateSnapshot(decision) {
    const key =
        decision?.recommendationKey ??
        decision?.relativeKey ??
        null;

    return {
        key,
        label:
            decision?.recommendationLabel ??
            decision?.relativeLabel ??
            "—",
        ev:
            key && Number.isFinite(
                decision?.ev?.[key]
            )
                ? decision.ev[key]
                : null,
        action:
            decision?.action ??
            LiveDecisionAction.WAIT,
        amount:
            Number.isFinite(decision?.amount)
                ? decision.amount
                : 0,
        evidence:
            decision?.evidence?.shortLabel ??
            "—"
    };
}


function comparisonFor(
    provisionalDecision,
    finalDecision
) {
    if (!provisionalDecision || !finalDecision) {
        return null;
    }

    const provisional =
        candidateSnapshot(
            provisionalDecision
        );

    const final =
        candidateSnapshot(
            finalDecision
        );

    return {
        provisional,
        final,
        candidateChanged:
            provisional.key !==
            final.key,
        actionChanged:
            provisional.action !==
            final.action,
        deltaEV:
            provisional.key === final.key &&
            Number.isFinite(provisional.ev) &&
            Number.isFinite(final.ev)
                ? final.ev - provisional.ev
                : null,
        replacedProvisional: true
    };
}


function confirmationBlocker(message) {
    return {
        code:
            "EXACT_CONFIRMATION_REQUIRED",
        message
    };
}


export default class ExactOpportunityConfirmation {
    constructor({
        clock = () => Date.now()
    } = {}) {
        if (typeof clock !== "function") {
            throw new TypeError(
                "ExactOpportunityConfirmation clock must be a function."
            );
        }

        this.clock = clock;
        this.sequence = 0;
        this.reset();
    }


    reset({
        sequence = this.sequence,
        roundId = null
    } = {}) {
        this.sequence = sequence;
        this.roundId =
            roundId === null ||
            roundId === undefined
                ? null
                : String(roundId);
        this.state =
            ExactOpportunityState.IDLE;
        this.provisionalAnalysis = null;
        this.provisionalDecision = null;
        this.finalAnalysis = null;
        this.finalDecision = null;
        this.comparison = null;
        this.errorMessage = null;
        this.startedAt = null;
        this.confirmedAt = null;
        return this.summary;
    }


    start({
        sequence = this.sequence + 1,
        roundId = null
    } = {}) {
        this.reset({
            sequence,
            roundId
        });

        this.state =
            ExactOpportunityState.QUICK_RUNNING;
        this.startedAt =
            this.clock();
        return this.summary;
    }


    matchesSequence(sequence) {
        return sequence === undefined ||
            sequence === null ||
            sequence === this.sequence;
    }


    matchesRound(analysis, fallback = null) {
        const candidate =
            roundIdFor(
                analysis,
                fallback
            );

        if (
            this.roundId !== null &&
            candidate !== null &&
            candidate !== this.roundId
        ) {
            return false;
        }

        if (this.roundId === null) {
            this.roundId = candidate;
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
        if (
            !this.matchesSequence(sequence) ||
            !this.matchesRound(
                analysis,
                roundId
            )
        ) {
            return false;
        }

        if (
            isExactOpportunityAnalysis(
                analysis
            )
        ) {
            return this.acceptExact(
                analysis,
                decision,
                {
                    sequence,
                    roundId
                }
            );
        }

        this.provisionalAnalysis =
            analysis;
        this.provisionalDecision =
            decision;
        this.finalAnalysis = null;
        this.finalDecision = null;
        this.comparison = null;
        this.errorMessage = null;
        this.state =
            ExactOpportunityState.PROVISIONAL;

        return true;
    }


    beginExact({
        sequence = this.sequence
    } = {}) {
        if (!this.matchesSequence(sequence)) {
            return false;
        }

        this.state =
            ExactOpportunityState.CONFIRMING;
        this.errorMessage = null;
        return true;
    }


    acceptExact(
        analysis,
        decision,
        {
            sequence = this.sequence,
            roundId = null
        } = {}
    ) {
        if (
            !isExactOpportunityAnalysis(
                analysis
            ) ||
            !this.matchesSequence(sequence) ||
            !this.matchesRound(
                analysis,
                roundId
            )
        ) {
            return false;
        }

        this.finalAnalysis =
            analysis;
        this.finalDecision =
            decision;
        this.comparison =
            comparisonFor(
                this.provisionalDecision,
                decision
            );
        this.errorMessage = null;
        this.state =
            ExactOpportunityState.CONFIRMED;
        this.confirmedAt =
            this.clock();

        return true;
    }


    fail(
        error,
        {
            sequence = this.sequence
        } = {}
    ) {
        if (!this.matchesSequence(sequence)) {
            return false;
        }

        this.state =
            ExactOpportunityState.FAILED;
        this.errorMessage =
            error?.message ??
            String(
                error ??
                "Exact analysis failed."
            );
        this.finalAnalysis = null;
        this.finalDecision = null;
        this.confirmedAt = null;
        return true;
    }


    decisionFor(fallback = null) {
        if (
            this.state ===
                ExactOpportunityState.CONFIRMED &&
            this.finalDecision
        ) {
            return {
                ...this.finalDecision,
                decisionFinal: true,
                decisionProvisional: false,
                confirmation:
                    this.summary
            };
        }

        const source =
            this.provisionalDecision ??
            fallback;

        if (!source) {
            return source;
        }

        const message =
            this.message;

        const blockers = [
            confirmationBlocker(
                message
            ),
            ...(
                Array.isArray(source.blockers)
                    ? source.blockers.filter(item =>
                        item?.code !==
                            "EXACT_CONFIRMATION_REQUIRED"
                    )
                    : []
            )
        ];

        return {
            ...source,
            action:
                LiveDecisionAction.WAIT,
            actionLabel:
                "觀望",
            strictAction:
                LiveDecisionAction.WAIT,
            strictKey: null,
            strictLabel:
                this.state ===
                    ExactOpportunityState.FAILED
                    ? "Exact 未完成：觀望"
                    : "等待 Exact 精算確認",
            shouldBet: false,
            amount: 0,
            headlineLabel:
                source.ready
                    ? "暫定候選"
                    : "狀態",
            blockers,
            primaryBlocker:
                message,
            reason:
                message,
            decisionFinal: false,
            decisionProvisional: true,
            evidence: {
                ...(source.evidence ?? {}),
                provisional: true,
                exactConfirmationRequired:
                    true
            },
            confirmation:
                this.summary
        };
    }


    get message() {
        switch (this.state) {
        case ExactOpportunityState.QUICK_RUNNING:
            return "正在建立下一局 MC 暫定估算；目前不可下注。";
        case ExactOpportunityState.PROVISIONAL:
            return "MC 快速估算僅為暫定候選，不可作為正式下注依據。";
        case ExactOpportunityState.CONFIRMING:
            return "Exact 精算確認中；暫定 MC 不會產生正式下注額。";
        case ExactOpportunityState.CONFIRMED:
            return this.finalDecision?.action ===
                LiveDecisionAction.BET
                ? "Exact 已確認正式下注機會。"
                : "Exact 已完成；最終策略為觀望。";
        case ExactOpportunityState.FAILED:
            return "Exact 精算未完成；依安全規則維持觀望。";
        default:
            return "等待下一局分析。";
        }
    }


    get summary() {
        return {
            version:
                EXACT_OPPORTUNITY_CONFIRMATION_VERSION,
            state:
                this.state,
            stateLabel:
                EXACT_OPPORTUNITY_STATE_LABEL[
                    this.state
                ],
            roundId:
                this.roundId,
            isFinal:
                this.state ===
                ExactOpportunityState.CONFIRMED,
            isProvisional:
                this.state ===
                    ExactOpportunityState.PROVISIONAL ||
                this.state ===
                    ExactOpportunityState.CONFIRMING,
            actionable:
                this.state ===
                    ExactOpportunityState.CONFIRMED &&
                this.finalDecision?.action ===
                    LiveDecisionAction.BET,
            message:
                this.message,
            errorMessage:
                this.errorMessage,
            comparison:
                this.comparison,
            startedAt:
                this.startedAt,
            confirmedAt:
                this.confirmedAt
        };
    }
}
