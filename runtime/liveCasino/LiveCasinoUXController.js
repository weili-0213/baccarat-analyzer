/**
 * Baccarat Analyzer V10.4.4
 * Path: runtime/liveCasino/LiveCasinoUXController.js
 * Purpose:
 *   3-second live analysis path + compact decision-first Dashboard bridge.
 */
import LiveCasinoPerformancePolicy, {
    LiveCasinoAnalysisProfile
} from "./LiveCasinoPerformancePolicy.js";

import LiveCasinoDecisionModel
    from "./LiveCasinoDecisionModel.js";

import {
    LIVE_CASINO_UX_CSS,
    LIVE_CASINO_UX_STYLE_ID
} from "./LiveCasinoUXStyles.js";

export const LIVE_CASINO_UX_CONTROLLER_VERSION = "10.4.5";
export const AI_LIVE_DECISION_UX_VERSION = "10.5.0";

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
        this.clock = clock;

        this.analysisProfile =
            LiveCasinoAnalysisProfile.QUICK;

        this.lastDecision = null;
        this.lastAnalysisDurationMs = null;
        this.lastAnalysisTimedOut = false;
        this.analysisSequence = 0;
        this.pendingRefine = null;
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
                            startedAt
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
                startedAt
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
        startedAt
    ) {
        this.lastAnalysisTimedOut =
            false;

        this.lastAnalysisDurationMs =
            Math.max(
                0,
                this.clock() -
                startedAt
            );

        this.lastDecision =
            this.decisionModel.build(
                analysis
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
                        const result =
                            await this.game
                                .analyzeNextRound(
                                    this.policy
                                        .getFullOptions()
                                );

                        this.lastDecision =
                            this.decisionModel
                                .build(result);

                        this.render?.();
                    }
                    catch {
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
        const live =
            this.decisionModel.build(
                this.game.nextAnalysis
            );

        if (live.ready) {
            this.lastDecision = live;
        }

        return (
            this.lastDecision ??
            live
        );
    }

    renderDecisionHTML() {
        const d =
            this.getDecision();

        const status =
            this.lastAnalysisTimedOut
                ? `超過 ${this.policy.decisionDeadlineMs} ms，背景完成中`
                : Number.isFinite(
                    this.lastAnalysisDurationMs
                )
                    ? `${this.lastAnalysisDurationMs} ms`
                    : "等待分析";

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
                        推薦：
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
                            信心：
                            <b data-decision-confidence>
                                ${pct(d.confidence)}
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
                    <small data-decision-reason>
                        原因：${escapeHTML(d.reason)}
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
                        · 風險 ${pct(d.risk)}
                    </div>
                </div>
            </section>
        `;
    }

    updateAIPanel(root) {
        const d =
            this.getDecision();

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
            "live-decision-engine-v10.5"
        );

        text(
            root,
            "[data-ai-simulation]",
            d.ready
                ? this.analysisProfile
                : "—"
        );

        text(
            root,
            "[data-ai-prediction]",
            d.recommendationLabel
        );

        text(
            root,
            "[data-ai-confidence]",
            pct(d.confidence)
        );

        text(
            root,
            "[data-ai-decision]",
            d.ready
                ? `${d.recommendationLabel} · ${d.actionLabel}`
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
                ? d.reason
                : "尚無決策回饋"
        );

        text(
            root,
            "[data-ai-learning]",
            runtimeSummary?.state
                ? `Runtime ${runtimeSummary.state}`
                : "Probability→EV→Confidence→Risk"
        );

        text(
            root,
            "[data-ai-adaptive]",
            d.ready
                ? `Ranking→${d.categoryLabel}`
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
    }

    destroy() {
        clearTimeout(
            this.pendingRefine
        );

        this.destroyed = true;
        this.aiRuntime = null;
        return this;
    }

    get summary() {
        return {
            version:
                LIVE_CASINO_UX_CONTROLLER_VERSION,
            liveDecisionVersion:
                AI_LIVE_DECISION_UX_VERSION,
            profile:
                this.analysisProfile,
            deadlineMs:
                this.policy
                    .decisionDeadlineMs,
            lastAnalysisDurationMs:
                this.lastAnalysisDurationMs,
            timedOut:
                this.lastAnalysisTimedOut,
            decision:
                this.getDecision()
        };
    }
}
