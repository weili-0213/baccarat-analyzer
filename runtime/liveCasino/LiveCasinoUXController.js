/**
 * Baccarat Analyzer V10.8.0
 * Path: runtime/liveCasino/LiveCasinoUXController.js
 * Purpose:
 *   3-second live analysis path + compact decision-first Dashboard bridge.
 */
import LiveCasinoPerformancePolicy, {
    LiveCasinoAnalysisProfile
} from "./LiveCasinoPerformancePolicy.js";

import LiveCasinoDecisionModel
    from "./LiveCasinoDecisionModel.js";

import SignalTrendMonitor, {
    SIGNAL_TREND_MONITOR_VERSION
} from "./SignalTrendMonitor.js";

import ExactOpportunityConfirmation, {
    EXACT_OPPORTUNITY_CONFIRMATION_VERSION,
    ExactOpportunityState,
    isExactOpportunityAnalysis
} from "./ExactOpportunityConfirmation.js";

import DecisionStabilityExplainabilityEngine, {
    DECISION_STABILITY_EXPLAINABILITY_VERSION,
    StableDecisionLifecycle
} from "./DecisionStabilityExplainabilityEngine.js";

import DecisionIntelligenceSignalAttributionEngine, {
    DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_VERSION
} from "./DecisionIntelligenceSignalAttributionEngine.js";

import WholeShoeProfitabilityStrategyValidationEngine, {
    WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_VERSION
} from "./WholeShoeProfitabilityStrategyValidationEngine.js";

import {
    LIVE_CASINO_UX_CSS,
    LIVE_CASINO_UX_STYLE_ID
} from "./LiveCasinoUXStyles.js";

export const LIVE_CASINO_UX_CONTROLLER_VERSION = "10.4.5";
export const AI_LIVE_DECISION_UX_VERSION = "10.5.0";
export const AI_LIVE_DECISION_DOCK_VERSION = "10.5.1";
export const AI_LIVE_DECISION_EVIDENCE_UX_VERSION = "10.5.2";
export const SIGNAL_TREND_OPPORTUNITY_UX_VERSION = "10.5.3";
export const EXACT_OPPORTUNITY_CONFIRMATION_UX_VERSION = "10.5.4";
export const DECISION_STABILITY_EXPLAINABILITY_UX_VERSION = "10.6.0";
export const DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_UX_VERSION = "10.7.0";
export const WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_UX_VERSION = "10.8.0";

function delay(ms) {
    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}

function pct(value) {
    return Number.isFinite(value)
        ? `${(value * 100).toFixed(2)}%`
        : "—";
}

function evText(value) {
    return Number.isFinite(value)
        ? `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`
        : "—";
}

function advantageText(value) {
    return Number.isFinite(value)
        ? `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`
        : "—";
}

function exactEVText(value) {
    return Number.isFinite(value)
        ? `${value >= 0 ? "+" : ""}${(value * 100).toFixed(4)}%`
        : "—";
}

function exactGapText(value) {
    return Number.isFinite(value)
        ? `${(value * 100).toFixed(4)}%`
        : "—";
}

function ratioText(value) {
    return Number.isFinite(value)
        ? value.toFixed(3)
        : "—";
}

function integerText(value) {
    return Number.isFinite(value)
        ? Math.floor(value).toLocaleString()
        : "—";
}

function probabilityPercentText(value) {
    return Number.isFinite(value)
        ? `${(value * 100).toFixed(1)}%`
        : "逐局重算";
}

function profitUnitsText(value) {
    return Number.isFinite(value)
        ? `${value > 0 ? "+" : ""}${value.toFixed(1)}u`
        : "—";
}

function evRangeText(evidence = {}) {
    if (
        !Number.isFinite(
            evidence.evLowerBound
        ) ||
        !Number.isFinite(
            evidence.evUpperBound
        )
    ) {
        return "—";
    }

    if (evidence.hasExact) {
        return evText(
            evidence.evLowerBound
        );
    }

    return `${evText(evidence.evLowerBound)} ～ ${evText(evidence.evUpperBound)}`;
}

function trendMovementText(trend = {}) {
    if (!trend.ready) {
        return "• 等待趨勢";
    }

    const movement =
        Number.isFinite(trend.deltaEV)
            ? ` ${evText(trend.deltaEV)}`
            : "";

    const provisional =
        trend.trendSampleCount >= 2 &&
        !trend.trendEvidenceQualified
            ? "暫定"
            : "";

    return `${trend.directionSymbol ?? "•"} ${provisional}${trend.directionLabel ?? "等待趨勢"}${movement}`;
}

function distanceToPositiveText(trend = {}) {
    if (
        !trend.ready ||
        !Number.isFinite(
            trend.distanceToPositiveEV
        )
    ) {
        return "—";
    }

    return trend.distanceToPositiveEV === 0
        ? "已達正 EV"
        : `${(trend.distanceToPositiveEV * 100).toFixed(2)}%`;
}


function confirmationStatusText(
    confirmation = {}
) {
    switch (confirmation.state) {
    case ExactOpportunityState.QUICK_RUNNING:
        return "MC 快速估算中｜目前不可下注";
    case ExactOpportunityState.PROVISIONAL:
        return "暫定 MC｜僅供觀察，不可下注";
    case ExactOpportunityState.CONFIRMING:
        return "Exact 精算確認中｜目前不可下注";
    case ExactOpportunityState.CONFIRMED:
        return confirmation.actionable
            ? "最終 Exact｜已通過正式決策確認"
            : "最終 Exact｜正式策略為觀望";
    case ExactOpportunityState.FAILED:
        return "Exact 未完成｜安全鎖定觀望";
    default:
        return "等待下一局分析";
    }
}


function confirmationComparisonHTML(
    confirmation = {}
) {
    const comparison =
        confirmation.comparison;

    if (
        !confirmation.isFinal ||
        !comparison?.replacedProvisional
    ) {
        return "";
    }

    const provisional =
        comparison.provisional ?? {};
    const final =
        comparison.final ?? {};

    return `
        <div
            class="v1054ResultReplacement"
            data-exact-result-replacement
        >
            <span>暫定 ${escapeHTML(provisional.evidence ?? "MC")}：${escapeHTML(provisional.label)} ${evText(provisional.ev)}</span>
            <b aria-hidden="true">→</b>
            <span>最終 ${escapeHTML(final.evidence ?? "Exact")}：${escapeHTML(final.label)} ${evText(final.ev)}</span>
            <small>最終 Exact 已取代暫定估算</small>
        </div>
    `;
}


function maturityComponentsHTML(
    maturity = {}
) {
    const components =
        Array.isArray(maturity.components)
            ? maturity.components
            : [];

    if (components.length === 0) {
        return "";
    }

    return components.map(item => `
        <span
            class="v106MaturityComponent"
            data-maturity-component="${escapeHTML(item.key)}"
            data-maturity-pass="${item.passed ? "true" : "false"}"
            title="${escapeHTML(item.detail)}"
        >
            ${escapeHTML(item.label)}
            <b>${item.earned}/${item.maximum}</b>
        </span>
    `).join("");
}


function missingConditionsHTML(
    maturity = {}
) {
    const conditions =
        Array.isArray(
            maturity.missingConditions
        )
            ? maturity.missingConditions
            : [];

    if (conditions.length === 0) {
        return `
            <small data-maturity-missing>
                缺少條件：無，正式安全門檻已齊備
            </small>
        `;
    }

    return `
        <small data-maturity-missing>
            缺少條件：${escapeHTML(conditions.join("；"))}
        </small>
    `;
}


function intelligenceMetricHTML({
    key,
    label,
    score,
    maximum = 100,
    status,
    detail = ""
}) {
    const safeScore =
        Number.isFinite(score)
            ? Math.max(
                0,
                Math.min(maximum, score)
            )
            : 0;
    const percent =
        maximum > 0
            ? safeScore /
                maximum * 100
            : 0;

    return `
        <article
            class="v107IntelligenceMetric"
            data-intelligence-metric="${escapeHTML(key)}"
            data-intelligence-score="${safeScore}"
        >
            <div>
                <span>${escapeHTML(label)}</span>
                <strong>${safeScore}/${maximum}</strong>
            </div>
            <div
                class="v107ScoreTrack"
                aria-hidden="true"
            >
                <i style="width:${percent.toFixed(2)}%"></i>
            </div>
            <small>
                ${escapeHTML(status)}
                ${detail ? `· ${escapeHTML(detail)}` : ""}
            </small>
        </article>
    `;
}


function decisionIntelligenceHTML(
    intelligence = {}
) {
    const canonical =
        intelligence.canonical ??
        {};
    const confirmation =
        intelligence.resultConfirmation ??
        {};
    const opportunity =
        intelligence.opportunityStrength ??
        {};
    const readiness =
        intelligence.executionReadiness ??
        {};
    const attribution =
        intelligence.signalAttribution ??
        {};
    const explanation =
        intelligence.explanation ??
        {};
    const lockText =
        canonical.locked
            ? "最終快照已鎖定"
            : canonical.formal
                ? "正式結果已確認"
                : "正式結果尚未發布";

    return `
        <div
            class="v107DecisionIntelligence"
            data-decision-intelligence
            data-decision-authority="${escapeHTML(canonical.authority)}"
            data-signal-attribution-type="${escapeHTML(attribution.type)}"
        >
            <div class="v107TruthBanner">
                <strong data-decision-authority-label>
                    唯一決策來源｜${escapeHTML(canonical.authorityLabel ?? "等待本局分析")}
                </strong>
                <span>${escapeHTML(lockText)}</span>
            </div>

            <div class="v107IntelligenceMetrics">
                ${intelligenceMetricHTML({
                    key: "result-confirmation",
                    label: "結果確認度",
                    score: confirmation.score,
                    maximum: confirmation.maximum,
                    status: confirmation.label ?? "等待分析",
                    detail: "不是勝率"
                })}
                ${intelligenceMetricHTML({
                    key: "opportunity-strength",
                    label: "機會強度",
                    score: opportunity.score,
                    maximum: opportunity.maximum,
                    status: opportunity.label ?? "條件不足"
                })}
                ${intelligenceMetricHTML({
                    key: "execution-readiness",
                    label: "執行門檻",
                    score: readiness.score,
                    maximum: readiness.maximum,
                    status: `${readiness.passedGateCount ?? 0}/${readiness.totalGateCount ?? 6} 項通過`
                })}
            </div>

            <div
                class="v107SignalAttribution"
                data-signal-attribution
            >
                <strong data-signal-attribution-headline>
                    ${escapeHTML(attribution.headline ?? "等待 Exact 最終歸因")}
                </strong>
                <span data-signal-attribution-summary>
                    ${escapeHTML(attribution.summary ?? "目前尚無可比較結果。")}
                </span>
            </div>

            <div class="v107PlainExplanation">
                <strong data-decision-plain-reason>
                    為何${canonical.action === "bet" ? "可下注" : "觀望"}：${escapeHTML(explanation.primary ?? "等待完整分析。")}
                </strong>
                <small data-decision-next-requirement>
                    尚需：${escapeHTML(explanation.nextRequirement ?? "等待 Exact 完成。")}
                </small>
            </div>
        </div>
    `;
}


function wholeShoeProjectionRowHTML(
    projection = {}
) {
    const selected =
        projection.selectedLabel &&
        projection.selectedLabel !== "觀望"
            ? `｜${projection.selectedLabel}`
            : "";

    return `
        <div
            class="v108ProjectionRow"
            data-whole-shoe-projection="${escapeHTML(projection.policyKey)}"
            data-projection-ready="${projection.ready ? "true" : "false"}"
        >
            <span>
                ${escapeHTML(projection.label ?? "策略")}${escapeHTML(selected)}
            </span>
            <b>
                獲利 ${probabilityPercentText(projection.positiveProbability)}
            </b>
            <small>
                預期 ${profitUnitsText(projection.expectedFinalProfitUnits)}
            </small>
        </div>
    `;
}


function wholeShoeStrategyHTML(
    report = {}
) {
    const realized =
        report.realizedValidation ??
        {};
    const projection =
        report.conditionalProjection ??
        {};
    const exact =
        realized.exactPositiveOnly ??
        {};
    const relative =
        realized.relativeBest ??
        {};
    const player =
        realized.playerFlat ??
        {};
    const banker =
        realized.bankerFlat ??
        {};
    const range =
        report.remainingRoundRange ??
        {};
    const safePolicy =
        report.safePolicy ??
        {};
    const opportunity =
        report.currentOpportunity ??
        {};

    return `
        <section
            class="v108WholeShoeStrategy"
            data-whole-shoe-strategy
            data-whole-shoe-version="${escapeHTML(report.version)}"
            data-whole-shoe-actionable="${opportunity.actionable ? "true" : "false"}"
        >
            <div class="v108WholeShoeHeader">
                <div>
                    <strong>整靴獲利與策略驗證</strong>
                    <small>實際 walk-forward ＋ 條件投影（不是牌序預測）</small>
                </div>
                <span data-whole-shoe-rules>
                    ${escapeHTML(report.rules?.label ?? "免佣百家樂")}
                </span>
            </div>

            <div class="v108WholeShoeStatus">
                <span>
                    已完成
                    <b data-whole-shoe-rounds>${report.roundsCompleted ?? 0}</b>
                    局
                </span>
                <span>
                    預估剩餘
                    <b data-whole-shoe-remaining>${escapeHTML(range.label ?? "—")}</b>
                </span>
                <span>
                    正式策略已驗證
                    <b>${exact.evaluatedRounds ?? 0}</b>
                    局
                </span>
            </div>

            <div class="v108SafePolicy">
                <strong data-whole-shoe-safe-policy>
                    整靴安全政策｜${escapeHTML(safePolicy.label ?? "只執行 Exact 正 EV")}
                </strong>
                <span>${escapeHTML(safePolicy.reason ?? "逐局等待 Exact。")}</span>
            </div>

            <div class="v108RealizedGrid">
                <article data-whole-shoe-ledger="exact-positive-only">
                    <span>Exact-only</span>
                    <strong data-whole-shoe-exact-profit>${profitUnitsText(exact.profitUnits)}</strong>
                    <small>下注 ${exact.bets ?? 0}｜勝 ${exact.wins ?? 0}｜負 ${exact.losses ?? 0}</small>
                </article>
                <article data-whole-shoe-ledger="relative-best">
                    <span>相對最佳</span>
                    <strong>${profitUnitsText(relative.profitUnits)}</strong>
                    <small>本次追蹤 ${relative.evaluatedRounds ?? 0} 局</small>
                </article>
                <article data-whole-shoe-ledger="player-flat">
                    <span>整靴固定閒</span>
                    <strong>${profitUnitsText(player.profitUnits)}</strong>
                    <small>實際 ${player.evaluatedRounds ?? 0} 局</small>
                </article>
                <article data-whole-shoe-ledger="banker-flat">
                    <span>整靴固定莊</span>
                    <strong>${profitUnitsText(banker.profitUnits)}</strong>
                    <small>莊 6 依半賠結算</small>
                </article>
            </div>

            <details class="v108ProjectionDetails">
                <summary>
                    <span>查看剩餘牌局條件投影</span>
                    <small>採 ${range.projection ?? 0} 局中位假設</small>
                </summary>
                <div class="v108ProjectionGrid">
                    ${wholeShoeProjectionRowHTML(projection.noBet)}
                    ${wholeShoeProjectionRowHTML(projection.playerFlat)}
                    ${wholeShoeProjectionRowHTML(projection.bankerFlat)}
                    ${wholeShoeProjectionRowHTML(projection.currentRelativeFlat)}
                    ${wholeShoeProjectionRowHTML(projection.exactPositiveOnly)}
                </div>
                <small class="v108ProjectionWarning">
                    ${escapeHTML(projection.assumption ?? "條件投影不代表未來牌序。")}
                    ${escapeHTML(report.opportunityForecast?.reason ?? "")}
                </small>
            </details>
        </section>
    `;
}

function trendSeriesHTML(trend = {}) {
    const series =
        Array.isArray(trend.series)
            ? trend.series
            : [];

    if (series.length === 0) {
        return `
            <span class="v1053TrendEmpty">
                完成本局後開始累積趨勢
            </span>
        `;
    }

    return series.map((point, index) => {
        const round =
            Number.isInteger(point.round)
                ? `#${point.round}`
                : `T${index + 1}`;

        return `
            <span
                class="v1053TrendPoint"
                data-trend-point
                data-trend-positive="${point.ev > 0 ? "true" : "false"}"
                title="${escapeHTML(`${round} ${trend.targetLabel} EV ${evText(point.ev)} · ${point.evidenceLabel ?? "—"}`)}"
            >
                ${escapeHTML(round)}
                <b>${evText(point.ev)}</b>
            </span>
        `;
    }).join("");
}

function escapeHTML(value) {
    return String(value ?? "—")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function text(root, selector, value) {
    const element =
        root?.querySelector?.(selector);

    if (element) {
        element.textContent =
            String(value ?? "—");
    }
}

export default class LiveCasinoUXController {
    constructor({
        game,
        render = null,
        aiRuntime = null,
        policy = null,
        decisionModel = null,
        signalTrendMonitor = null,
        exactConfirmation = null,
        decisionStabilityEngine = null,
        decisionIntelligenceEngine = null,
        wholeShoeStrategyEngine = null,
        clock = () => Date.now()
    } = {}) {
        if (!game) {
            throw new TypeError(
                "LiveCasinoUXController requires game."
            );
        }

        this.game = game;
        this.render = render;
        this.aiRuntime = aiRuntime;
        this.policy =
            policy ??
            new LiveCasinoPerformancePolicy();
        this.decisionModel =
            decisionModel ??
            new LiveCasinoDecisionModel();
        this.signalTrendMonitor =
            signalTrendMonitor ??
            new SignalTrendMonitor();
        this.exactConfirmation =
            exactConfirmation ??
            new ExactOpportunityConfirmation({
                clock
            });
        this.decisionStabilityEngine =
            decisionStabilityEngine ??
            new DecisionStabilityExplainabilityEngine({
                clock
            });
        this.decisionIntelligenceEngine =
            decisionIntelligenceEngine ??
            new DecisionIntelligenceSignalAttributionEngine();
        this.wholeShoeStrategyEngine =
            wholeShoeStrategyEngine ??
            new WholeShoeProfitabilityStrategyValidationEngine();

        if (
            typeof this.signalTrendMonitor
                .observe !== "function" ||
            typeof this.signalTrendMonitor
                .reset !== "function"
        ) {
            throw new TypeError(
                "signalTrendMonitor requires observe() and reset()."
            );
        }

        if (
            typeof this.exactConfirmation
                .start !== "function" ||
            typeof this.exactConfirmation
                .acceptProvisional !== "function" ||
            typeof this.exactConfirmation
                .acceptExact !== "function" ||
            typeof this.exactConfirmation
                .decisionFor !== "function"
        ) {
            throw new TypeError(
                "exactConfirmation requires the V10.5.4 lifecycle API."
            );
        }

        if (
            typeof this.decisionStabilityEngine
                .start !== "function" ||
            typeof this.decisionStabilityEngine
                .acceptProvisional !== "function" ||
            typeof this.decisionStabilityEngine
                .acceptFinal !== "function" ||
            typeof this.decisionStabilityEngine
                .decorate !== "function"
        ) {
            throw new TypeError(
                "decisionStabilityEngine requires the V10.6 lifecycle API."
            );
        }

        if (
            typeof this.decisionIntelligenceEngine
                .explain !== "function"
        ) {
            throw new TypeError(
                "decisionIntelligenceEngine requires the V10.7 explain() API."
            );
        }

        if (
            typeof this.wholeShoeStrategyEngine
                .explain !== "function" ||
            typeof this.wholeShoeStrategyEngine
                .reset !== "function"
        ) {
            throw new TypeError(
                "wholeShoeStrategyEngine requires the V10.8 explain() and reset() API."
            );
        }

        this.clock = clock;

        this.analysisProfile =
            LiveCasinoAnalysisProfile.QUICK;

        this.lastDecision = null;
        this.lastAcceptedAnalysis = null;
        this.lastSignalTrend =
            this.signalTrendMonitor.summary;
        this.lastAnalysisDurationMs = null;
        this.lastAnalysisTimedOut = false;
        this.lastAnalysisStage = "idle";
        this.analysisSequence = 0;
        this.pendingRefine = null;
        this.decisionObserver = null;
        this.destroyed = false;
    }

    setProfile(profile) {
        if (
            !Object.values(
                LiveCasinoAnalysisProfile
            ).includes(profile)
        ) {
            throw new Error(
                `Unknown live analysis profile: ${profile}`
            );
        }

        this.analysisProfile = profile;
        return this;
    }

    explainDecision(decision) {
        if (!decision) {
            return decision;
        }

        const intelligence =
            this.decisionIntelligenceEngine
                .explain(
                    decision,
                    {
                        confirmation:
                            decision.confirmation ??
                            this.exactConfirmation
                                .summary,
                        trend:
                            this.getSignalTrend()
                    }
                );

        return this.wholeShoeStrategyEngine
            .explain(
                intelligence,
                this.getWholeShoeContext()
            );
    }

    getWholeShoeContext() {
        return {
            shoeId:
                this.game.shoeNumber ??
                null,
            roundCount:
                this.game.roundCount ??
                this.game.history?.count ??
                0,
            history:
                this.game.history ??
                [],
            remainingCards:
                this.game.remainingCards ??
                this.game.shoe
                    ?.physicalRemaining ??
                null,
            observableRemaining:
                this.game
                    .observableRemainingCards ??
                this.game.shoe
                    ?.observableRemaining ??
                null
        };
    }

    setLastDecision(decision) {
        this.lastDecision =
            this.explainDecision(
                decision
            );

        return this.lastDecision;
    }

    ensureStyles() {
        if (
            typeof document === "undefined" ||
            document.getElementById(
                LIVE_CASINO_UX_STYLE_ID
            )
        ) {
            return;
        }

        const style =
            document.createElement("style");

        style.id =
            LIVE_CASINO_UX_STYLE_ID;

        style.textContent =
            LIVE_CASINO_UX_CSS;

        document.head?.appendChild(style);
    }

    async runAnalysis({
        profile = this.analysisProfile,
        refine = true
    } = {}) {
        if (
            typeof this.game
                .analyzeNextRound !==
            "function"
        ) {
            return null;
        }

        const sequence =
            ++this.analysisSequence;

        this.setProfile(profile);

        clearTimeout(
            this.pendingRefine
        );

        this.pendingRefine = null;

        this.exactConfirmation.start({
            sequence
        });

        this.decisionStabilityEngine.start({
            sequence,
            shoeId:
                this.game.shoeNumber
        });

        this.lastAnalysisStage =
            "quick-running";

        /*
         * Mark the previous nextAnalysis as consumed. While the new Quick
         * result is running it must not be re-labelled as this round's result.
         */
        this.lastAcceptedAnalysis =
            this.game.nextAnalysis;

        this.setLastDecision(
            this.decisionStabilityEngine
                .decorate(
                    this.exactConfirmation
                        .decisionFor(
                            this.decisionModel
                                .build(null)
                        ),
                    {
                        final: false,
                        lifecycle:
                            StableDecisionLifecycle
                                .ANALYZING
                    }
                )
        );

        this.render?.();

        const startedAt =
            this.clock();

        const quickOptions =
            this.policy.getQuickOptions();

        const analysisPromise =
            Promise.resolve(
                this.game.analyzeNextRound(
                    quickOptions
                )
            );

        const timeoutToken =
            Symbol("deadline");

        let raced;

        try {
            raced =
                await Promise.race([
                    analysisPromise,
                    delay(
                        this.policy
                            .decisionDeadlineMs
                    ).then(() => timeoutToken)
                ]);
        }
        catch (error) {
            this.lastAnalysisDurationMs =
                Math.max(
                    0,
                    this.clock() -
                        startedAt
                );
            this.lastAnalysisTimedOut =
                false;
            this.lastAnalysisStage =
                "failed";
            this.exactConfirmation
                .fail(error, {
                    sequence
                });
            this.setLastDecision(
                this.decisionStabilityEngine
                    .expire(
                        this.exactConfirmation
                            .decisionFor(
                                this.lastDecision
                            ),
                        {
                            sequence,
                            reason:
                                this.exactConfirmation
                                    .summary
                                    .message
                        }
                    )
            );
            this.render?.();

            return {
                timedOut: false,
                failed: true,
                error,
                analysis: null,
                decision:
                    this.lastDecision,
                durationMs:
                    this.lastAnalysisDurationMs
            };
        }

        if (raced === timeoutToken) {
            this.lastAnalysisTimedOut =
                true;

            this.lastAnalysisStage =
                "background";

            this.lastAnalysisDurationMs =
                this.policy
                    .decisionDeadlineMs;

            this.render?.();

            analysisPromise
                .then(result => {
                    if (
                        !this.destroyed &&
                        sequence ===
                            this.analysisSequence
                    ) {
                        this.acceptAnalysis(
                            result,
                            startedAt,
                            "quick"
                        );

                        if (
                            refine &&
                            !this.exactConfirmation
                                .summary
                                .isFinal
                        ) {
                            this.scheduleRefinement(
                                sequence
                            );
                        }
                    }
                })
                .catch(error => {
                    if (
                        !this.destroyed &&
                        sequence ===
                            this.analysisSequence
                    ) {
                        this.exactConfirmation
                            .fail(error, {
                                sequence
                            });
                        this.lastAnalysisStage =
                            "failed";
                        this.setLastDecision(
                            this.decisionStabilityEngine
                                .expire(
                                    this.exactConfirmation
                                        .decisionFor(
                                            this.lastDecision
                                        ),
                                    {
                                        sequence,
                                        reason:
                                            this.exactConfirmation
                                                .summary
                                                .message
                                    }
                                )
                        );
                        this.render?.();
                    }
                });

            return {
                timedOut: true,
                deadlineMs:
                    this.policy
                        .decisionDeadlineMs,
                analysis:
                    this.game.nextAnalysis,
                decision:
                    this.lastDecision
            };
        }

        const result =
            this.acceptAnalysis(
                raced,
                startedAt,
                "quick"
            );

        if (
            refine &&
            !this.exactConfirmation
                .summary
                .isFinal
        ) {
            this.scheduleRefinement(
                sequence
            );
        }

        return {
            timedOut: false,
            analysis: result,
            decision:
                this.lastDecision,
            durationMs:
                this.lastAnalysisDurationMs
        };
    }

    acceptAnalysis(
        analysis,
        startedAt,
        stage = "quick"
    ) {
        this.lastAnalysisTimedOut =
            false;

        this.lastAnalysisDurationMs =
            Math.max(
                0,
                this.clock() -
                startedAt
            );

        const rawDecision =
            this.decisionModel.build(
                analysis
            );

        const exact =
            stage === "confirmed" ||
            stage === "refined" ||
            isExactOpportunityAnalysis(
                analysis
            );

        const accepted = exact
            ? this.exactConfirmation
                .acceptExact(
                    analysis,
                    rawDecision,
                    {
                        sequence:
                            this.analysisSequence
                    }
                )
            : this.exactConfirmation
                .acceptProvisional(
                    analysis,
                    rawDecision,
                    {
                        sequence:
                            this.analysisSequence
                    }
                );

        if (!accepted) {
            throw new Error(
                exact
                    ? "Exact result does not match the active round."
                    : "Quick result does not match the active round."
            );
        }

        this.lastAnalysisStage =
            exact
                ? "confirmed"
                : "provisional";

        this.lastAcceptedAnalysis =
            analysis;

        const confirmedDecision =
            this.exactConfirmation
                .decisionFor(
                    rawDecision
                );

        const stableDecision = exact
            ? this.decisionStabilityEngine
                .acceptFinal(
                    analysis,
                    confirmedDecision,
                    {
                        sequence:
                            this.analysisSequence,
                        roundId:
                            analysis
                                ?.generatedAfterRound ??
                            analysis
                                ?.roundNumber ??
                            null,
                        durationMs:
                            this.lastAnalysisDurationMs
                    }
                )
            : this.decisionStabilityEngine
                .acceptProvisional(
                    analysis,
                    confirmedDecision,
                    {
                        sequence:
                            this.analysisSequence,
                        roundId:
                            analysis
                                ?.generatedAfterRound ??
                            analysis
                                ?.roundNumber ??
                            null
                    }
                );

        if (!stableDecision) {
            throw new Error(
                exact
                    ? "V10.6 rejected a stale Exact final snapshot."
                    : "V10.6 rejected a stale provisional result."
            );
        }

        /*
         * V10.5.4 trend history is final-result only. The same-round Quick
         * estimate is deliberately excluded so it cannot become historical
         * evidence before Exact confirmation.
         */
        if (exact) {
            this.observeSignalTrend(
                analysis,
                stableDecision
            );
        }

        this.setLastDecision(
            stableDecision
        );

        this.render?.();

        return analysis;
    }

    scheduleRefinement(sequence) {
        if (
            typeof this.game
                .analyzeNextRound !==
            "function"
        ) {
            return;
        }

        clearTimeout(
            this.pendingRefine
        );

        if (
            !this.exactConfirmation
                .beginExact({
                    sequence
                }) ||
            !this.decisionStabilityEngine
                .beginExact({
                    sequence
                })
        ) {
            return;
        }

        this.lastAnalysisStage =
            "confirming";

        this.setLastDecision(
            this.decisionStabilityEngine
                .decorate(
                    this.exactConfirmation
                        .decisionFor(
                            this.lastDecision
                        ),
                    {
                        final: false,
                        lifecycle:
                            StableDecisionLifecycle
                                .EXACT_CONFIRMING
                    }
                )
        );

        this.render?.();

        this.pendingRefine =
            setTimeout(
                async () => {
                    this.pendingRefine = null;

                    if (
                        this.destroyed ||
                        sequence !==
                            this.analysisSequence
                    ) {
                        return;
                    }

                    if (
                        this.game
                            .isManualRoundActive
                    ) {
                        this.exactConfirmation
                            .fail(
                                new Error(
                                    "The next round has already started."
                                ),
                                {
                                    sequence
                                }
                            );
                        this.lastAnalysisStage =
                            "failed";
                        this.setLastDecision(
                            this.decisionStabilityEngine
                                .expire(
                                    this.exactConfirmation
                                        .decisionFor(
                                            this.lastDecision
                                        ),
                                    {
                                        sequence,
                                        reason:
                                            this.exactConfirmation
                                                .summary
                                                .message
                                    }
                                )
                        );
                        this.render?.();
                        return;
                    }

                    try {
                        const startedAt =
                            this.clock();

                        const result =
                            await this.game
                                .analyzeNextRound(
                                    this.policy
                                        .getFullOptions()
                                );

                        if (
                            !isExactOpportunityAnalysis(
                                result
                            )
                        ) {
                            throw new Error(
                                "Hybrid analysis did not provide Exact evidence."
                            );
                        }

                        this.acceptAnalysis(
                            result,
                            startedAt,
                            "confirmed"
                        );
                    }
                    catch (error) {
                        if (
                            this.destroyed ||
                            sequence !==
                                this.analysisSequence
                        ) {
                            return;
                        }

                        this.exactConfirmation
                            .fail(error, {
                                sequence
                            });
                        this.lastAnalysisStage =
                            "failed";
                        this.setLastDecision(
                            this.decisionStabilityEngine
                                .expire(
                                    this.exactConfirmation
                                        .decisionFor(
                                            this.lastDecision
                                        ),
                                    {
                                        sequence,
                                        reason:
                                            this.exactConfirmation
                                                .summary
                                                .message
                                    }
                                )
                        );
                        this.render?.();
                    }
                },
                this.policy
                    .refineDelayMs
            );
    }

    async confirmBurn(card) {
        let info;

        if (
            typeof this.game
                .confirmBurnIndicator ===
            "function"
        ) {
            /*
             * V10.4.4 critical-path guard.
             *
             * New Game implementations honor the per-call { analyze:false }
             * override.  The temporary option guard also protects compatible
             * older Game builds whose confirmBurnIndicator() ignores a second
             * argument but still reads options.analyzeAfterBurn.
             */
            const hasOptions =
                this.game.options &&
                typeof this.game.options ===
                    "object";

            const previousAnalyzeAfterBurn =
                hasOptions
                    ? this.game.options
                        .analyzeAfterBurn
                    : undefined;

            try {
                if (hasOptions) {
                    this.game.options
                        .analyzeAfterBurn =
                        false;
                }

                info =
                    await this.game
                        .confirmBurnIndicator(
                            card,
                            {
                                analyze: false
                            }
                        );
            }
            finally {
                if (hasOptions) {
                    this.game.options
                        .analyzeAfterBurn =
                        previousAnalyzeAfterBurn;
                }
            }
        }
        else if (
            typeof this.game
                .confirmBurn ===
            "function"
        ) {
            info =
                await this.game
                    .confirmBurn(
                        card
                    );

            if (
                info?.confirmed === true &&
                !this.game
                    .burnConfirmed
            ) {
                this.game.burnConfirmed =
                    true;
            }
        }
        else {
            throw new Error(
                "Dashboard game does not support burn confirmation."
            );
        }

        this.render?.();

        // Do not block burn confirmation on analysis.
        void this.runAnalysis();

        return info;
    }

    async finishRound() {
        if (
            typeof this.game
                .finishManualRound ===
            "function"
        ) {
            const result =
                await this.game
                    .finishManualRound({
                        analyze: false
                    });

            this.render?.();

            // Start next decision immediately, but keep UI responsive.
            void this.runAnalysis();

            return result;
        }

        return null;
    }

    getDecision() {
        const analysis =
            this.game.nextAnalysis;

        if (
            this.lastAnalysisStage ===
                "quick-running"
        ) {
            return this.lastDecision ??
                this.explainDecision(
                    this.decisionStabilityEngine
                        .decorate(
                        this.exactConfirmation
                            .decisionFor(
                                this.decisionModel
                                    .build(null)
                            ),
                        {
                            final: false,
                            lifecycle:
                                StableDecisionLifecycle
                                    .ANALYZING
                        }
                        )
                );
        }

        if (!analysis) {
            const waiting =
                this.decisionModel
                    .build(null);

            return this.lastDecision ??
                this.explainDecision(
                    this.decisionStabilityEngine
                        .decorate(
                        this.exactConfirmation
                            .decisionFor(
                                waiting
                            ),
                        {
                            final: false,
                            lifecycle:
                                StableDecisionLifecycle
                                    .ANALYZING
                        }
                        )
                );
        }

        if (
            analysis ===
                this.lastAcceptedAnalysis &&
            this.lastDecision
        ) {
            return this.lastDecision;
        }

        const live =
            this.decisionModel.build(
                analysis
            );

        if (!live.ready) {
            return this.lastDecision ??
                this.explainDecision(
                    live
                );
        }

        const exact =
            isExactOpportunityAnalysis(
                analysis
            );

        const incomingRound =
            analysis.generatedAfterRound ??
            analysis.roundNumber ??
            null;

        const active =
            this.exactConfirmation
                .summary;

        if (
            !exact &&
            active.isFinal &&
            active.roundId !== null &&
            incomingRound !== null &&
            String(incomingRound) ===
                active.roundId
        ) {
            return this.lastDecision;
        }

        let accepted = exact
            ? this.exactConfirmation
                .acceptExact(
                    analysis,
                    live,
                    {
                        sequence:
                            this.analysisSequence,
                        roundId:
                            incomingRound
                    }
                )
            : this.exactConfirmation
                .acceptProvisional(
                    analysis,
                    live,
                    {
                        sequence:
                            this.analysisSequence,
                        roundId:
                            incomingRound
                    }
                );

        if (!accepted) {
            const sequence =
                ++this.analysisSequence;

            this.exactConfirmation.start({
                sequence,
                roundId:
                    incomingRound
            });

            this.decisionStabilityEngine.start({
                sequence,
                roundId:
                    incomingRound,
                shoeId:
                    this.game.shoeNumber
            });

            accepted = exact
                ? this.exactConfirmation
                    .acceptExact(
                        analysis,
                        live,
                        {
                            sequence,
                            roundId:
                                incomingRound
                        }
                    )
                : this.exactConfirmation
                    .acceptProvisional(
                        analysis,
                        live,
                        {
                            sequence,
                            roundId:
                                incomingRound
                        }
                    );
        }

        if (accepted) {
            this.lastAcceptedAnalysis =
                analysis;
            this.lastAnalysisStage =
                exact
                    ? "confirmed"
                    : "provisional";
            const confirmedDecision =
                this.exactConfirmation
                    .decisionFor(live);

            const stableDecision = exact
                ? this.decisionStabilityEngine
                    .acceptFinal(
                        analysis,
                        confirmedDecision,
                        {
                            sequence:
                                this.analysisSequence,
                            roundId:
                                incomingRound,
                            durationMs:
                                this.lastAnalysisDurationMs
                        }
                    )
                : this.decisionStabilityEngine
                    .acceptProvisional(
                        analysis,
                        confirmedDecision,
                        {
                            sequence:
                                this.analysisSequence,
                            roundId:
                                incomingRound
                        }
                    );

            if (exact) {
                this.observeSignalTrend(
                    analysis,
                    stableDecision
                );
            }

            this.setLastDecision(
                stableDecision
            );
        }

        return this.lastDecision ??
            this.explainDecision(
                this.decisionStabilityEngine
                    .decorate(
                    this.exactConfirmation
                        .decisionFor(live),
                    {
                        final: false
                    }
                    )
            );
    }

    observeSignalTrend(
        analysis,
        decision
    ) {
        if (
            !analysis ||
            !decision?.ready
        ) {
            return this.lastSignalTrend;
        }

        this.lastSignalTrend =
            this.signalTrendMonitor
                .observe(
                    analysis,
                    decision,
                    {
                        shoeNumber:
                            this.game
                                .shoeNumber
                    }
                );

        return this.lastSignalTrend;
    }

    getSignalTrend() {
        return (
            this.lastSignalTrend ??
            this.signalTrendMonitor
                .summary
        );
    }

    resetSignalTrend() {
        clearTimeout(
            this.pendingRefine
        );

        this.pendingRefine = null;
        this.analysisSequence++;
        this.lastDecision = null;
        this.lastAcceptedAnalysis = null;
        this.lastAnalysisDurationMs = null;
        this.lastAnalysisTimedOut = false;
        this.lastAnalysisStage = "idle";

        this.exactConfirmation.reset({
            sequence:
                this.analysisSequence
        });

        this.decisionStabilityEngine
            .reset();

        this.wholeShoeStrategyEngine
            .reset({
                shoeId:
                    this.game.shoeNumber ??
                    null,
                roundCount:
                    this.game.roundCount ??
                    0
            });

        this.signalTrendMonitor.reset({
            shoeId:
                this.game.shoeNumber
        });

        this.lastSignalTrend =
            this.signalTrendMonitor.summary;

        return this;
    }

    renderDecisionHTML() {
        const d =
            this.getDecision();

        const confirmation =
            d.confirmation ??
            this.exactConfirmation
                .summary;

        const status =
            this.lastAnalysisTimedOut
                ? `超過 ${this.policy.decisionDeadlineMs} ms，背景完成中`
                : Number.isFinite(
                    this.lastAnalysisDurationMs
                )
                    ? `${confirmation.stateLabel} ${this.lastAnalysisDurationMs} ms`
                    : confirmation.stateLabel;

        const evidence =
            d.evidence ?? {};
        const trend =
            this.getSignalTrend();
        const maturity =
            d.opportunityMaturity ??
            {};
        const closeCall =
            d.closeCall ??
            {};
        const intelligence =
            d.decisionIntelligence ??
            {};
        const wholeShoe =
            d.wholeShoeStrategy ??
            {};
        const resultConfirmation =
            intelligence
                .resultConfirmation ??
            {};
        const evSourceLabel =
            d.stableDecisionFinal
                ? "Exact EV"
                : "暫定 MC EV";

        const blockerHTML =
            d.primaryBlocker
                ? `
                    <small data-decision-blocker>
                        阻擋：${escapeHTML(d.primaryBlocker)}
                    </small>
                `
                : `
                    <small data-decision-pass>
                        通過：穩健正 EV、證據、波動與 Kelly
                    </small>
                `;

        return `
            <section
                class="v1044Decision v105LiveDecision"
                data-live-decision
                data-decision-category="${escapeHTML(d.category)}"
                data-decision-action="${escapeHTML(d.action)}"
                data-confirmation-state="${escapeHTML(confirmation.state)}"
                data-decision-final="${confirmation.isFinal ? "true" : "false"}"
                data-decision-provisional="${confirmation.isFinal ? "false" : "true"}"
                data-stable-lifecycle="${escapeHTML(d.lifecycle)}"
                data-market-state="${escapeHTML(d.marketState)}"
                data-close-call="${closeCall.active ? "true" : "false"}"
                data-final-snapshot="${escapeHTML(d.finalSnapshot?.snapshotId ?? "")}"
            >
                <div class="v1044DecisionCard v1044DecisionMain">
                    <span class="v1044Meta">下一局決策</span>
                    <div
                        class="v1054ConfirmationState"
                        data-exact-confirmation-status
                    >
                        <strong>${escapeHTML(confirmationStatusText(confirmation))}</strong>
                        <small>${escapeHTML(confirmation.message)}</small>
                    </div>
                    <div class="v105DecisionHeadline">
                        ${escapeHTML(d.headlineLabel ?? "狀態")}：
                        <strong data-decision-recommendation>
                            ${escapeHTML(d.recommendationLabel)}
                        </strong>
                    </div>
                    ${decisionIntelligenceHTML(intelligence)}
                    ${wholeShoeStrategyHTML(wholeShoe)}
                    <div
                        class="v106DecisionState"
                        data-decision-stability-state
                    >
                        <span>
                            決策階段：
                            <b data-stable-lifecycle-label>
                                ${escapeHTML(d.lifecycleLabel)}
                            </b>
                        </span>
                        <span>
                            市場狀態：
                            <b data-market-state-label>
                                ${escapeHTML(d.marketStateLabel)}
                            </b>
                        </span>
                    </div>
                    <div class="v105DecisionBadges">
                        <span>
                            策略：
                            <b data-decision-strategy>
                                ${escapeHTML(d.actionLabel)}
                            </b>
                        </span>
                        <span>
                            信號：
                            <b data-decision-signal>
                                ${escapeHTML(d.marketStateLabel ?? d.categoryLabel)}
                            </b>
                        </span>
                        <span>
                            證據：
                            <b data-decision-evidence>
                                ${escapeHTML(evidence.label ?? "等待分析")}
                            </b>
                        </span>
                        <span>
                            結果確認度：
                            <b data-decision-confidence>
                                ${resultConfirmation.score ?? 0}/${resultConfirmation.maximum ?? 100}（非勝率）
                            </b>
                        </span>
                    </div>
                    <div
                        class="v106ExactEVComparison"
                        data-exact-ev-comparison
                    >
                        <span>${evSourceLabel}｜閒 <b data-exact-player-ev>${exactEVText(d.ev?.player)}</b></span>
                        <span>莊 <b data-exact-banker-ev>${exactEVText(d.ev?.banker)}</b></span>
                        <span>差距 <b data-exact-main-gap>${exactGapText(closeCall.gap)}</b></span>
                        <small>
                            穩定門檻 ${exactGapText(closeCall.threshold)}
                            ${closeCall.active ? "· 低於門檻，不硬選閒／莊" : ""}
                        </small>
                    </div>
                    <details
                        class="v106Maturity"
                        data-opportunity-maturity
                        data-maturity-score="${maturity.score ?? 0}"
                    >
                        <summary class="v106MaturityHeader">
                            <span>安全證據分解（V10.6）</span>
                            <strong data-maturity-score>
                                ${maturity.score ?? 0}/${maturity.maximum ?? 100}
                            </strong>
                            <small>點擊查看原始門檻</small>
                        </summary>
                        <div class="v106MaturityComponents">
                            ${maturityComponentsHTML(maturity)}
                        </div>
                        ${missingConditionsHTML(maturity)}
                    </details>
                    <div class="v105DecisionMeta">
                        相對優勢：
                        <b data-decision-advantage>
                            ${advantageText(d.relativeAdvantage)}
                        </b>
                        · 建議額：
                        <b data-decision-amount>${d.amount ?? 0}</b>
                    </div>
                    <div class="v105DecisionEvidence">
                        EV 證據範圍：
                        <b data-decision-ev-range>
                            ${evRangeText(evidence)}
                        </b>
                        · 相對波動比：
                        <b data-decision-volatility>
                            ${ratioText(d.risk)}
                        </b>
                        · Kelly 試算：
                        <b data-decision-kelly-amount>
                            ${integerText(d.sizing?.calculatedAmount)}
                        </b>
                    </div>
                    ${blockerHTML}
                    ${confirmationComparisonHTML(confirmation)}
                    <div
                        class="v1053Opportunity"
                        data-signal-trend
                        data-trend-direction="${escapeHTML(trend.direction)}"
                        data-opportunity-state="${escapeHTML(trend.opportunityState)}"
                    >
                        <span>
                            機會：
                            <b data-opportunity-label>
                                ${escapeHTML(trend.opportunityLabel)}
                            </b>
                        </span>
                        <span>
                            趨勢：
                            <b data-trend-direction>
                                ${escapeHTML(trendMovementText(trend))}
                            </b>
                        </span>
                        <span>
                            距正 EV：
                            <b data-opportunity-distance>
                                ${escapeHTML(distanceToPositiveText(trend))}
                            </b>
                        </span>
                        <span>
                            安全門檻：
                            <b data-opportunity-gates>
                                ${trend.passedGateCount ?? 0}/${trend.totalGateCount ?? 5}
                            </b>
                        </span>
                    </div>
                    <div
                        class="v1053TrendSeries"
                        data-trend-series
                        aria-label="${escapeHTML(`${trend.targetLabel ?? "主注"}最近 EV 趨勢`)}"
                    >
                        <span class="v1053TrendSeriesLabel">
                            ${escapeHTML(trend.targetLabel ?? "主注")}近 ${trend.trendSampleCount ?? 0} 局
                            · 連續最佳 ${trend.bestStreak ?? 0} 局
                        </span>
                        ${trendSeriesHTML(trend)}
                    </div>
                    <small data-decision-reason>
                        核心判斷：${escapeHTML(intelligence.explanation?.primary ?? d.reason)}
                    </small>
                </div>

                <div class="v1044DecisionCard v1044Player">
                    <span>閒家</span>
                    <strong>${pct(d.probability.player)}</strong>
                    <small>EV ${evText(d.ev.player)}</small>
                </div>

                <div class="v1044DecisionCard v1044Banker">
                    <span>莊家</span>
                    <strong>${pct(d.probability.banker)}</strong>
                    <small>EV ${evText(d.ev.banker)}</small>
                </div>

                <div class="v1044DecisionCard v1044Tie">
                    <span>和局</span>
                    <strong>${pct(d.probability.tie)}</strong>
                    <small>EV ${evText(d.ev.tie)}</small>
                </div>

                <div class="v1044DecisionCard v1044DecisionAI">
                    <span class="v1044Meta">AI Live Decision Engine</span>
                    <strong>${status}</strong>
                    <div>
                        ${escapeHTML(d.categoryLabel)}
                        · ${escapeHTML(d.lifecycleLabel)}
                        · 機會強度 ${intelligence.opportunityStrength?.score ?? 0}/100
                        · 執行門檻 ${intelligence.executionReadiness?.passedGateCount ?? 0}/${intelligence.executionReadiness?.totalGateCount ?? 6}
                        · 波動比 ${ratioText(d.risk)}
                    </div>
                </div>
            </section>
        `;
    }

    renderDecisionDockHTML() {
        const d =
            this.getDecision();

        const confirmation =
            d.confirmation ??
            this.exactConfirmation
                .summary;

        const evidence =
            d.evidence ?? {};
        const trend =
            this.getSignalTrend();
        const maturity =
            d.opportunityMaturity ??
            {};
        const closeCall =
            d.closeCall ??
            {};
        const intelligence =
            d.decisionIntelligence ??
            {};
        const canonical =
            intelligence.canonical ??
            {};
        const attribution =
            intelligence.signalAttribution ??
            {};
        const explanation =
            intelligence.explanation ??
            {};
        const resultConfirmation =
            intelligence.resultConfirmation ??
            {};
        const opportunityStrength =
            intelligence.opportunityStrength ??
            {};
        const executionReadiness =
            intelligence.executionReadiness ??
            {};
        const wholeShoe =
            d.wholeShoeStrategy ??
            {};
        const exactLedger =
            wholeShoe.realizedValidation
                ?.exactPositiveOnly ??
            {};
        const remainingRange =
            wholeShoe.remainingRoundRange ??
            {};

        const dockReason =
            !confirmation.isFinal
                ? confirmation.message
                : `${attribution.headline ?? "Exact 已完成"}｜${explanation.primary ?? d.primaryBlocker ?? d.reason}`;

        return `
            <section
                class="v105DecisionDock"
                data-live-decision-dock
                data-decision-category="${escapeHTML(d.category)}"
                data-decision-action="${escapeHTML(d.action)}"
                data-confirmation-state="${escapeHTML(confirmation.state)}"
                data-decision-final="${confirmation.isFinal ? "true" : "false"}"
                data-decision-provisional="${confirmation.isFinal ? "false" : "true"}"
                data-trend-direction="${escapeHTML(trend.direction)}"
                data-opportunity-state="${escapeHTML(trend.opportunityState)}"
                data-stable-lifecycle="${escapeHTML(d.lifecycle)}"
                data-market-state="${escapeHTML(d.marketState)}"
                data-close-call="${closeCall.active ? "true" : "false"}"
                data-decision-authority="${escapeHTML(canonical.authority)}"
                data-signal-attribution-type="${escapeHTML(attribution.type)}"
                data-whole-shoe-version="${escapeHTML(wholeShoe.version)}"
                aria-live="polite"
                aria-hidden="true"
            >
                <span class="v105DecisionDockLabel">
                    下一局 · ${escapeHTML(canonical.source ?? "等待")}
                </span>
                <strong class="v105DecisionDockPick">
                    ${escapeHTML(explanation.decisionLine ?? `${d.headlineLabel ?? "狀態"}：${d.recommendationLabel}`)}
                </strong>
                <span class="v105DecisionDockAction">
                    ${escapeHTML(canonical.authorityLabel ?? d.lifecycleLabel)}
                    · ${escapeHTML(d.marketStateLabel)}
                </span>
                <span class="v105DecisionDockConfidence">
                    確認 ${resultConfirmation.score ?? 0}/100
                    · 機會 ${opportunityStrength.score ?? 0}/100
                </span>
                <span class="v105DecisionDockAmount">
                    門檻 ${executionReadiness.passedGateCount ?? 0}/${executionReadiness.totalGateCount ?? 6}
                    · 建議額 ${d.amount ?? 0}
                    · 整靴 ${profitUnitsText(exactLedger.profitUnits)}
                </span>
                <small
                    class="v105DecisionDockReason"
                    title="${escapeHTML(dockReason)}"
                >
                    ${escapeHTML(dockReason)}｜剩餘約 ${escapeHTML(remainingRange.label ?? "—")}
                </small>
            </section>
        `;
    }

    observeDecisionVisibility(root) {
        this.decisionObserver
            ?.disconnect?.();

        this.decisionObserver = null;

        const decision =
            root?.querySelector?.(
                "[data-live-decision]"
            );

        const dock =
            root?.querySelector?.(
                "[data-live-decision-dock]"
            );

        if (!decision || !dock) {
            return;
        }

        const setVisible = visible => {
            dock.classList?.toggle(
                "v105DecisionDockVisible",
                visible
            );

            dock.setAttribute?.(
                "aria-hidden",
                visible ? "false" : "true"
            );
        };

        if (
            typeof IntersectionObserver ===
            "undefined"
        ) {
            const rect =
                decision
                    .getBoundingClientRect?.();

            setVisible(
                Boolean(
                    rect &&
                    (
                        rect.bottom <= 0 ||
                        rect.top < 0
                    )
                )
            );

            return;
        }

        this.decisionObserver =
            new IntersectionObserver(
                entries => {
                    const entry =
                        entries[0];

                    if (!entry) {
                        return;
                    }

                    setVisible(
                        !entry.isIntersecting ||
                        entry.intersectionRatio < 0.6
                    );
                },
                {
                    threshold: [0, 0.6, 1]
                }
            );

        this.decisionObserver
            .observe(decision);
    }

    updateAIPanel(root) {
        const d =
            this.getDecision();
        const trend =
            this.getSignalTrend();
        const confirmation =
            d.confirmation ??
            this.exactConfirmation
                .summary;
        const maturity =
            d.opportunityMaturity ??
            {};
        const intelligence =
            d.decisionIntelligence ??
            {};
        const canonical =
            intelligence.canonical ??
            {};
        const resultConfirmation =
            intelligence.resultConfirmation ??
            {};
        const opportunityStrength =
            intelligence.opportunityStrength ??
            {};
        const executionReadiness =
            intelligence.executionReadiness ??
            {};
        const attribution =
            intelligence.signalAttribution ??
            {};
        const explanation =
            intelligence.explanation ??
            {};
        const wholeShoe =
            d.wholeShoeStrategy ??
            {};
        const exactLedger =
            wholeShoe.realizedValidation
                ?.exactPositiveOnly ??
            {};
        const playerProjection =
            wholeShoe.conditionalProjection
                ?.playerFlat ??
            {};

        const runtimeSummary =
            this.aiRuntime?.summary ??
            null;

        text(
            root,
            "[data-ai-status]",
            d.lifecycle ??
                (
                    confirmation.isFinal
                        ? "final-decision-ready"
                        : "waiting-data"
                )
        );

        text(
            root,
            "[data-ai-stage]",
            "whole-shoe-profitability-strategy-validation-v10.8"
        );

        text(
            root,
            "[data-ai-simulation]",
            d.ready
                ? `${canonical.authorityLabel ?? confirmation.stateLabel} · ${d.evidence?.label ?? this.analysisProfile}`
                : "—"
        );

        text(
            root,
            "[data-ai-prediction]",
            `${d.headlineLabel ?? "狀態"}：${d.recommendationLabel}`
        );

        text(
            root,
            "[data-ai-confidence]",
            `${resultConfirmation.score ?? 0}/100（結果確認，非勝率）`
        );

        text(
            root,
            "[data-ai-decision]",
            d.ready
                ? `${d.headlineLabel ?? "狀態"} ${d.recommendationLabel} · ${d.actionLabel}`
                : "等待分析"
        );

        text(
            root,
            "[data-ai-strategy]",
            d.ready
                ? d.marketStateLabel ??
                    d.categoryLabel
                : "—"
        );

        text(
            root,
            "[data-ai-bet]",
            d.amount > 0
                ? d.amount
                : 0
        );

        text(
            root,
            "[data-ai-execution]",
            d.ready
                ? d.actionLabel
                : "等待分析"
        );

        text(
            root,
            "[data-ai-feedback]",
            confirmation.isFinal
                ? `${attribution.headline ?? d.lifecycleLabel}｜${explanation.primary ?? d.reason}`
                : d.ready
                    ? confirmation.message
                : "尚無決策回饋"
        );

        text(
            root,
            "[data-ai-learning]",
            runtimeSummary?.state
                ? `Runtime ${runtimeSummary.state}`
                : `整靴 Exact-only ${profitUnitsText(exactLedger.profitUnits)} · 已驗證 ${exactLedger.evaluatedRounds ?? 0} 局`
        );

        text(
            root,
            "[data-ai-adaptive]",
            confirmation.isFinal &&
                d.ready
                ? `固定閒條件獲利 ${probabilityPercentText(playerProjection.positiveProbability)} · 剩餘 ${wholeShoe.remainingRoundRange?.label ?? "—"} · ${wholeShoe.safePolicy?.label ?? "只執行 Exact 正 EV"}`
                : `${confirmation.stateLabel} · 正式決策尚未發布`
        );
    }

    identifyRoadSection(root) {
        const direct =
            root?.querySelector?.(
                ".v3RoadmapPanel"
            );

        const roadButton =
            root?.querySelector?.(
                '[data-action="select-road"]'
            );

        const section =
            direct ??
            roadButton?.closest?.("section") ??
            roadButton?.parentElement ??
            null;

        if (section) {
            section.classList?.add(
                "v1044RoadSection"
            );
        }

        return section;
    }

    applyUI(
        root,
        {
            roadmapExpanded = false,
            aiExpanded = false
        } = {}
    ) {
        if (!root) {
            return;
        }

        this.ensureStyles();

        root.setAttribute?.(
            "data-live-casino-v1044",
            "true"
        );

        root.setAttribute?.(
            "data-live-casino-v105",
            "true"
        );

        root.setAttribute?.(
            "data-live-casino-v1054",
            "true"
        );

        root.setAttribute?.(
            "data-live-casino-v106",
            "true"
        );

        root.setAttribute?.(
            "data-live-casino-v107",
            "true"
        );

        root.setAttribute?.(
            "data-live-casino-v108",
            "true"
        );

        root.querySelector?.(
            "[data-live-decision]"
        )?.remove?.();

        root.querySelector?.(
            "[data-live-decision-dock]"
        )?.remove?.();

        const page =
            root.querySelector?.(
                ".dashboardPage"
            ) ??
            root.querySelector?.(
                "[data-page='dashboard']"
            ) ??
            root.firstElementChild;

        page?.insertAdjacentHTML?.(
            "afterbegin",
            this.renderDecisionHTML()
        );

        root.insertAdjacentHTML?.(
            "beforeend",
            this.renderDecisionDockHTML()
        );

        const road =
            this.identifyRoadSection(root);

        road?.classList?.toggle(
            "v1044Collapsed",
            !roadmapExpanded
        );

        const aiPanel =
            root.querySelector?.(
                "[data-ai-closed-loop-panel]"
            );

        aiPanel?.classList?.toggle(
            "v1044AIHidden",
            !aiExpanded
        );

        if (
            page &&
            !root.querySelector?.(
                "[data-live-utility]"
            )
        ) {
            page.insertAdjacentHTML(
                "beforeend",
                `
                <div
                    class="v1044UtilityBar"
                    data-live-utility
                >
                    <button
                        type="button"
                        data-action="toggle-roadmap"
                    >
                        ${roadmapExpanded
                            ? "收合路單"
                            : "路單 ▾"}
                    </button>
                    <button
                        type="button"
                        data-action="toggle-ai"
                    >
                        ${aiExpanded
                            ? "收合 AI"
                            : "AI 詳細 ▾"}
                    </button>
                </div>
                `
            );
        }

        this.updateAIPanel(root);
        this.observeDecisionVisibility(root);
    }

    destroy() {
        clearTimeout(
            this.pendingRefine
        );

        this.decisionObserver
            ?.disconnect?.();

        this.decisionObserver = null;

        this.destroyed = true;
        this.aiRuntime = null;
        return this;
    }

    get summary() {
        const decision =
            this.getDecision();

        return {
            version:
                LIVE_CASINO_UX_CONTROLLER_VERSION,
            liveDecisionVersion:
                AI_LIVE_DECISION_UX_VERSION,
            evidenceUXVersion:
                AI_LIVE_DECISION_EVIDENCE_UX_VERSION,
            signalTrendVersion:
                SIGNAL_TREND_OPPORTUNITY_UX_VERSION,
            signalTrendMonitorVersion:
                SIGNAL_TREND_MONITOR_VERSION,
            exactConfirmationVersion:
                EXACT_OPPORTUNITY_CONFIRMATION_UX_VERSION,
            exactConfirmationCoreVersion:
                EXACT_OPPORTUNITY_CONFIRMATION_VERSION,
            decisionStabilityVersion:
                DECISION_STABILITY_EXPLAINABILITY_UX_VERSION,
            decisionStabilityCoreVersion:
                DECISION_STABILITY_EXPLAINABILITY_VERSION,
            decisionIntelligenceVersion:
                DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_UX_VERSION,
            decisionIntelligenceCoreVersion:
                DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_VERSION,
            wholeShoeStrategyVersion:
                WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_UX_VERSION,
            wholeShoeStrategyCoreVersion:
                WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_VERSION,
            profile:
                this.analysisProfile,
            deadlineMs:
                this.policy
                    .decisionDeadlineMs,
            lastAnalysisDurationMs:
                this.lastAnalysisDurationMs,
            analysisStage:
                this.lastAnalysisStage,
            timedOut:
                this.lastAnalysisTimedOut,
            signalTrend:
                this.getSignalTrend(),
            exactConfirmation:
                this.exactConfirmation
                    .summary,
            decisionStability:
                this.decisionStabilityEngine
                    .summary,
            decisionAudit:
                this.decisionStabilityEngine
                    .getAuditTrail(),
            decisionIntelligence:
                this.decisionIntelligenceEngine
                    .summary,
            wholeShoeStrategy:
                this.wholeShoeStrategyEngine
                    .summary,
            decision:
                decision
        };
    }
}
