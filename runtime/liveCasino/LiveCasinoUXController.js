/**
 * Baccarat Analyzer V10.5.3
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

import {
    LIVE_CASINO_UX_CSS,
    LIVE_CASINO_UX_STYLE_ID
} from "./LiveCasinoUXStyles.js";

export const LIVE_CASINO_UX_CONTROLLER_VERSION = "10.4.5";
export const AI_LIVE_DECISION_UX_VERSION = "10.5.0";
export const AI_LIVE_DECISION_DOCK_VERSION = "10.5.1";
export const AI_LIVE_DECISION_EVIDENCE_UX_VERSION = "10.5.2";
export const SIGNAL_TREND_OPPORTUNITY_UX_VERSION = "10.5.3";

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

        this.clock = clock;

        this.analysisProfile =
            LiveCasinoAnalysisProfile.QUICK;

        this.lastDecision = null;
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

        this.lastAnalysisStage =
            "quick-running";

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

        const raced =
            await Promise.race([
                analysisPromise,
                delay(
                    this.policy
                        .decisionDeadlineMs
                ).then(() => timeoutToken)
            ]);

        if (raced === timeoutToken) {
            this.lastAnalysisTimedOut =
                true;

            this.lastAnalysisStage =
                "background";

            this.lastAnalysisDurationMs =
                this.policy
                    .decisionDeadlineMs;

            this.lastDecision =
                this.decisionModel.build(
                    this.game.nextAnalysis
                );

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
                    }
                })
                .catch(() => {});

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
            profile ===
                LiveCasinoAnalysisProfile.FULL &&
            refine
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

        this.lastAnalysisStage =
            stage;

        this.lastDecision =
            this.decisionModel.build(
                analysis
            );

        this.observeSignalTrend(
            analysis,
            this.lastDecision
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

        this.pendingRefine =
            setTimeout(
                async () => {
                    if (
                        this.destroyed ||
                        sequence !==
                            this.analysisSequence ||
                        this.game
                            .isManualRoundActive
                    ) {
                        return;
                    }

                    try {
                        const startedAt =
                            this.clock();

                        this.lastAnalysisStage =
                            "refining";

                        this.render?.();

                        const result =
                            await this.game
                                .analyzeNextRound(
                                    this.policy
                                        .getFullOptions()
                                );

                        this.acceptAnalysis(
                            result,
                            startedAt,
                            "refined"
                        );
                    }
                    catch {
                        this.lastAnalysisStage =
                            "quick";
                        // Quick decision is already available.
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
        const live =
            this.decisionModel.build(
                analysis
            );

        if (live.ready) {
            this.lastDecision = live;
            this.observeSignalTrend(
                analysis,
                live
            );
        }

        return (
            this.lastDecision ??
            live
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
        this.lastAnalysisDurationMs = null;
        this.lastAnalysisTimedOut = false;
        this.lastAnalysisStage = "idle";

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

        const status =
            this.lastAnalysisTimedOut
                ? `超過 ${this.policy.decisionDeadlineMs} ms，背景完成中`
                : this.lastAnalysisStage ===
                    "refining"
                    ? "背景精算中（目前為快速結果）"
                : Number.isFinite(
                    this.lastAnalysisDurationMs
                )
                    ? `${this.lastAnalysisStage === "refined"
                        ? "精算"
                        : "快速"} ${this.lastAnalysisDurationMs} ms`
                    : "等待分析";

        const evidence =
            d.evidence ?? {};
        const trend =
            this.getSignalTrend();

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
            >
                <div class="v1044DecisionCard v1044DecisionMain">
                    <span class="v1044Meta">下一局決策</span>
                    <div class="v105DecisionHeadline">
                        ${escapeHTML(d.headlineLabel ?? "狀態")}：
                        <strong data-decision-recommendation>
                            ${escapeHTML(d.recommendationLabel)}
                        </strong>
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
                                ${escapeHTML(d.categoryLabel)}
                            </b>
                        </span>
                        <span>
                            證據：
                            <b data-decision-evidence>
                                ${escapeHTML(evidence.label ?? "等待分析")}
                            </b>
                        </span>
                        <span>
                            估計可靠度：
                            <b data-decision-confidence>
                                ${pct(evidence.confidence)}
                            </b>
                        </span>
                    </div>
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
                        判斷：${escapeHTML(d.reason)}
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
                        · ${escapeHTML(evidence.shortLabel ?? "等待")}
                        · 波動比 ${ratioText(d.risk)}
                    </div>
                </div>
            </section>
        `;
    }

    renderDecisionDockHTML() {
        const d =
            this.getDecision();

        const evidence =
            d.evidence ?? {};
        const trend =
            this.getSignalTrend();

        const dockReason =
            trend.ready
                ? `${trend.opportunityLabel} · ${d.primaryBlocker ?? trend.opportunityReason}`
                : d.primaryBlocker ??
                    d.reason;

        return `
            <section
                class="v105DecisionDock"
                data-live-decision-dock
                data-decision-category="${escapeHTML(d.category)}"
                data-decision-action="${escapeHTML(d.action)}"
                data-trend-direction="${escapeHTML(trend.direction)}"
                data-opportunity-state="${escapeHTML(trend.opportunityState)}"
                aria-live="polite"
                aria-hidden="true"
            >
                <span class="v105DecisionDockLabel">下一局</span>
                <strong class="v105DecisionDockPick">
                    ${escapeHTML(d.headlineLabel ?? "狀態")}：${escapeHTML(d.recommendationLabel)}
                </strong>
                <span class="v105DecisionDockAction">
                    ${escapeHTML(d.actionLabel)} · ${escapeHTML(d.categoryLabel)}
                </span>
                <span class="v105DecisionDockConfidence">
                    ${escapeHTML(evidence.shortLabel ?? "等待")}
                    · ${escapeHTML(trend.directionSymbol ?? "•")}${escapeHTML(trend.directionLabel ?? "等待趨勢")}
                </span>
                <span class="v105DecisionDockAmount">
                    建議額 ${d.amount ?? 0}
                </span>
                <small
                    class="v105DecisionDockReason"
                    title="${escapeHTML(dockReason)}"
                >
                    ${escapeHTML(dockReason)}
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

        const runtimeSummary =
            this.aiRuntime?.summary ??
            null;

        text(
            root,
            "[data-ai-status]",
            d.ready
                ? "decision-ready"
                : "waiting-data"
        );

        text(
            root,
            "[data-ai-stage]",
            "signal-trend-opportunity-v10.5.3"
        );

        text(
            root,
            "[data-ai-simulation]",
            d.ready
                ? d.evidence?.label ??
                    this.analysisProfile
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
            pct(d.evidence?.confidence)
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
                ? d.categoryLabel
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
            d.ready
                ? `${trend.opportunityLabel}：${d.primaryBlocker ?? trend.opportunityReason}`
                : "尚無決策回饋"
        );

        text(
            root,
            "[data-ai-learning]",
            runtimeSummary?.state
                ? `Runtime ${runtimeSummary.state}`
                : `${trend.targetLabel ?? "主注"}近 ${trend.trendSampleCount ?? 0} 局 · ${trendMovementText(trend)}`
        );

        text(
            root,
            "[data-ai-adaptive]",
            d.ready
                ? `${trend.opportunityLabel} · 安全門檻 ${trend.passedGateCount ?? 0}/${trend.totalGateCount ?? 5}`
                : "等待下一局資料"
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
            decision:
                decision
        };
    }
}
