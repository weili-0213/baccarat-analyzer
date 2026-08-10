/**
 * Baccarat Analyzer V10.7.0
 * Path: pages/dashboard.js
 * Purpose:
 *   Live Casino UX & Performance Refactor.
 *   Preserves the legacy Dashboard Page Object API required by app/app.js
 *   while retaining the V10.1 static Dashboard and AI Closed-Loop UI contract.
 */

import Game
    from "../engine/game.js";

import createQuickCardInput, {
    QuickCardInput,
    QuickInputMode
} from "../components/QuickCardInput.js";

import AnalysisPanel, {
    AnalysisDisplayMode
} from "../components/AnalysisPanel.js";

import RecommendationPanel
    from "../components/RecommendationPanel.js";

import StatusPanel
    from "../components/StatusPanel.js";

import GameController
    from "../controllers/GameController.js";

import UIController
    from "../controllers/UIController.js";

import AnalysisController
    from "../controllers/AnalysisController.js";

import InputController
    from "../controllers/InputController.js";

import DashboardRenderer
    from "../renderers/DashboardRenderer.js";

import RoundRenderer
    from "../renderers/RoundRenderer.js";

import HistoryRenderer
    from "../renderers/HistoryRenderer.js";

import RoadmapRenderer
    from "../renderers/RoadmapRenderer.js";

import createLiveCasinoUXController
    from "../runtime/liveCasino/createLiveCasinoUXController.js";


export const DASHBOARD_VERSION = "3.4.3";

/**
 * V10.1 template contract version is intentionally retained because
 * dashboard.test.js and the Closed-Loop UI contract were introduced there.
 */
export const DASHBOARD_PAGE_VERSION = "10.1.0";

/**
 * V10.4.1 marks the compatibility refactor that combines:
 * - V3.4.3 Page Object API required by app/app.js
 * - V10.1 static Dashboard / AI Closed-Loop HTML contract
 */
export const DASHBOARD_COMPATIBILITY_VERSION = "10.4.5";
export const DASHBOARD_LIVE_DECISION_VERSION = "10.5.0";
export const DASHBOARD_DECISION_CALIBRATION_VERSION = "10.5.2";
export const DASHBOARD_SIGNAL_TREND_VERSION = "10.5.3";
export const DASHBOARD_EXACT_OPPORTUNITY_CONFIRMATION_VERSION = "10.5.4";
export const DASHBOARD_DECISION_STABILITY_EXPLAINABILITY_VERSION = "10.6.0";
export const DASHBOARD_DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_VERSION = "10.7.0";

export const DashboardMode = AnalysisDisplayMode;

export const DashboardSection = Object.freeze({
    INPUT: "input",
    INSIGHT: "insight",
    ROADMAP: "roadmap"
});


export class Dashboard {
    constructor({
        root = null,
        game = null,
        gameOptions = {},
        aiRuntime = null,
        livePerformance = {},
        autoMount = true
    } = {}) {
        if (
            root !== null &&
            !(root instanceof Element) &&
            typeof root !== "string"
        ) {
            throw new TypeError("Dashboard root must be an Element, selector, or null.");
        }

        if (!gameOptions || typeof gameOptions !== "object" || Array.isArray(gameOptions)) {
            throw new TypeError("gameOptions must be an object.");
        }

        this.root = this.resolveRoot(root);
        this.game = game ?? new Game(gameOptions);

        this.uiController =
            new UIController({

                modeValues:
                    Object.values(
                        DashboardMode
                    ),

                defaultMode:
                    DashboardMode.QUICK,

                defaultSection:
                    DashboardSection.INPUT,

                quickInputMode:
                    QuickInputMode.AUTO

            });

        this.ui =
            this.uiController.state;

        this.ui.roadmapExpanded =
            false;

        this.ui.aiExpanded =
            false;

        this.components = {
            quickCardInput: null,
            statusPanel: new StatusPanel({ game: this.game }),
            analysisPanel: new AnalysisPanel(),
            recommendationPanel: new RecommendationPanel()
        };

        this.gameController =
            new GameController({

                game:
                    this.game,

                uiController:
                    this.uiController,

                render:
                    () =>
                        this.render()

            });

        this.analysisController =
            new AnalysisController({

                game:
                    this.game,

                actionController:
                    this.gameController,

                uiController:
                    this.uiController

            });

        this.inputController =
            new InputController({

                game:
                    this.game,

                actionController:
                    this.gameController,

                uiController:
                    this.uiController,

                inputSection:
                    DashboardSection.INPUT

            });

        this.liveCasino =
            createLiveCasinoUXController({
                game:
                    this.game,

                aiRuntime,

                performance:
                    livePerformance,

                render:
                    () =>
                        this.render()
            });


        this.renderers = {

            dashboard:
                new DashboardRenderer({

                    version:
                        DASHBOARD_VERSION,

                    sections:
                        DashboardSection,

                    modes:
                        DashboardMode

                }),

            round:
                new RoundRenderer(),

            history:
                new HistoryRenderer({

                    limit:
                        20

                }),

            roadmap:
                new RoadmapRenderer()

        };

        this.boundClick = event => this.handleClick(event);
        this.boundChange = event => this.handleChange(event);
        this.boundQuickCardSelect = event => this.handleQuickCardSelect(event);
        this.boundKeyDown = event => this.handleDashboardKeyDown(event);

        if (autoMount && this.root) {
            this.mount();
        }
    }

    resolveRoot(root) {
        if (root instanceof Element) return root;
        if (typeof root === "string") return document.querySelector(root);

        return document.querySelector("[data-page='dashboard']") ??
            document.getElementById("dashboard") ??
            document.getElementById("app");
    }

    mount(root = this.root) {
        const resolved = this.resolveRoot(root);

        if (!resolved) {
            throw new Error("Dashboard root element was not found.");
        }

        this.unbind();
        this.root = resolved;
        this.root.addEventListener("click", this.boundClick);
        this.root.addEventListener("change", this.boundChange);
        this.root.addEventListener("quick-card:select", this.boundQuickCardSelect);
        window.addEventListener("keydown", this.boundKeyDown);
        this.render();
        return this;
    }

    unbind() {
        this.root?.removeEventListener("click", this.boundClick);
        this.root?.removeEventListener("change", this.boundChange);
        this.root?.removeEventListener("quick-card:select", this.boundQuickCardSelect);
        window.removeEventListener("keydown", this.boundKeyDown);
        this.components.quickCardInput?.destroy();
        this.components.quickCardInput = null;
        return this;
    }

    destroy() {
        this.unbind();
        if (this.root) this.root.innerHTML = "";
        return this;
    }

    setMode(mode) {
        this.uiController.setMode(mode);
        this.render();
        return this;
    }

    setMobileSection(section) {
        this.uiController.setMobileSection(
            section,
            Object.values(DashboardSection)
        );
        this.render();
        return this;
    }

    setMessage(message, type = "info") {
        this.uiController.setMessage(message, type);
        return this;
    }

    clearMessage() {
        this.uiController.clearMessage();
        return this;
    }

    runAction(callback, options = {}) {
        return this.gameController.run(
            callback,
            options
        );
    }

    async handleClick(event) {
        const button = event.target.closest("[data-action]");
        if (!button || !this.root?.contains(button)) return;

        const action = button.dataset.action;

        switch (action) {
            case "new-shoe":
                await this.startNewShoe();
                break;
            case "confirm-burn":
                await this.confirmBurn();
                break;
            case "start-round":
                await this.startRound();
                break;
            case "undo-card":
                await this.undoCard();
                break;
            case "cancel-round":
                await this.cancelRound();
                break;
            case "finish-round":
                await this.finishRound();
                break;
            case "analyze":
                await this.analyze();
                break;
            case "set-dashboard-mode":
                this.setMode(button.dataset.mode);
                break;
            case "set-mobile-section":
                this.setMobileSection(button.dataset.section);
                break;
            case "clear-message":
                this.clearMessage();
                this.render();
                break;
            case "select-road":
                this.uiController.setRoad(
                    button.dataset.road
                );
                this.render();
                break;

            case "toggle-roadmap":
                this.ui.roadmapExpanded =
                    !this.ui
                        .roadmapExpanded;
                this.render();
                break;

            case "toggle-ai":
                this.ui.aiExpanded =
                    !this.ui
                        .aiExpanded;
                this.render();
                break;
        }
    }

    handleChange(event) {
        if (event.target.name === "card-rank") {
            this.uiController.setBurnRank(
                event.target.value
            );
        }

        if (event.target.name === "card-suit") {
            this.uiController.setBurnSuit(
                event.target.value
            );
        }
    }

    async handleQuickCardSelect(event) {
        const { rank, suit } = event.detail ?? {};
        if (!rank || !suit) return;
        await this.addSelectedCard({ rank, suit });
    }

    async handleDashboardKeyDown(event) {
        const target = event.target;

        if (
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target instanceof HTMLSelectElement ||
            target?.isContentEditable === true
        ) {
            return;
        }

        if (!this.game.isManualRoundActive || this.ui.busy) {
            return;
        }

        if (event.key === "Backspace") {
            event.preventDefault();

            if (this.inputController.canUndo()) {
                await this.undoCard();
            }

            return;
        }

        if (event.key === "Enter" && this.game.canFinishManualRound) {
            event.preventDefault();
            await this.finishRound();
            return;
        }

        if (event.key === "Escape" && !this.components.quickCardInput?.selectedRank) {
            event.preventDefault();
            await this.cancelRound();
        }
    }


    async startNewShoe() {
        const result =
            await this.inputController
                .startNewShoe();

        if (result !== null) {
            this.liveCasino
                .resetSignalTrend();

            this.render();
        }

        return result;
    }

    /**
     * V10.4.4 Burn Critical Path Compatibility
     *
     * Supported Game contracts:
     *
     * 1. Legacy / current Baccarat Game
     *      game.confirmBurnIndicator({ rank, suit })
     *      -> AnalysisController.confirmBurn()
     *
     * 2. Runtime / adapter compatible Game
     *      game.confirmBurn({ rank, suit })
     *      -> Dashboard compatibility fallback
     *
     * app/app.js only depends on the public Dashboard API:
     *
     *      page.ui.selectedRank
     *      page.ui.selectedSuit
     *      await page.confirmBurn()
     *      game.burnConfirmed === true
     */
    async confirmBurn() {
        const card = {
            rank:
                this.ui.selectedRank,

            suit:
                this.ui.selectedSuit
        };

        const info =
            await this.liveCasino
                .confirmBurn(card);

        this.setMessage(
            "燒牌已確認；快速分析已在背景啟動。",
            "success"
        );

        this.render();

        return info;
    }


    startRound() {
        return this.inputController
            .startRound();
    }

    addSelectedCard(card) {
        return this.inputController
            .addCard(card);
    }

    undoCard() {
        return this.inputController
            .undoCard();
    }

    cancelRound() {
        return this.inputController
            .cancelRound();
    }

    async finishRound() {
        const result =
            await this.liveCasino
                .finishRound();

        this.setMessage(
            "本局已確認；下一局快速分析已啟動。",
            "success"
        );

        this.render();

        return result;
    }

    analyze() {
        return this.liveCasino
            .runAnalysis({
                profile:
                    this.ui.mode ===
                    DashboardMode.FULL
                        ? "full"
                        : "quick"
            });
    }

    render() {
        if (!this.root) {
            return this;
        }

        this.components.quickCardInput
            ?.destroy();

        this.components.quickCardInput =
            null;


        const analysis =
            this.game.nextAnalysis ??
            null;


        this.components.statusPanel
            .setGame(
                this.game
            );

        this.components.analysisPanel
            .setData({

                analysis,

                mode:
                    this.ui.mode,

                busy:
                    this.game.isAnalyzing

            });

        this.components.recommendationPanel
            .setData({

                analysis,

                mode:
                    this.ui.mode,

                minBet:
                    100,

                maxBet:
                    10000

            });


        this.root.innerHTML =
            this.renderers.dashboard
                .renderShell({

                    ui:
                        this.ui,

                    statusHTML:
                        this.components
                            .statusPanel
                            .render(),

                    roundHTML:
                        this.renderers
                            .round
                            .render({

                                game:
                                    this.game,

                                ui:
                                    this.ui

                            }),

                    recommendationHTML:
                        this.components
                            .recommendationPanel
                            .render(),

                    analysisHTML:
                        this.components
                            .analysisPanel
                            .render(),

                    historyHTML:
                        this.renderers
                            .history
                            .render(
                                this.game
                            ),

                    roadmapHTML:
                        this.renderers
                            .roadmap
                            .render({

                                game:
                                    this.game,

                                activeRoad:
                                    this.ui
                                        .activeRoad

                            }),

                    roundCount:
                        this.game
                            .roundCount ??
                        0,

                    hasAnalysis:
                        Boolean(
                            analysis
                        ),

                    isManualRoundActive:
                        Boolean(
                            this.game
                                .isManualRoundActive
                        )

                });


        this.mountQuickCardInput();
        this.mountAIClosedLoopPanel();

        this.liveCasino
            .setProfile(
                this.ui.mode ===
                    DashboardMode.FULL
                    ? "full"
                    : "quick"
            )
            .applyUI(
                this.root,
                {
                    roadmapExpanded:
                        this.ui
                            .roadmapExpanded,

                    aiExpanded:
                        this.ui
                            .aiExpanded
                }
            );

        return this;
    }


    mountAIClosedLoopPanel() {
        if (!this.root) {
            return this;
        }

        if (
            this.root.querySelector(
                "[data-ai-closed-loop-panel]"
            )
        ) {
            return this;
        }

        const dashboardPage =
            this.root.querySelector(
                ".dashboardPage"
            ) ??
            this.root.querySelector(
                "[data-page='dashboard']"
            ) ??
            this.root;

        dashboardPage.insertAdjacentHTML(
            "beforeend",
            renderAIClosedLoopPanel()
        );

        return this;
    }


    /**
     * Compatibility alias used by newer runtime/bootstrap layers.
     */
    refresh() {
        return this.render();
    }


    /**
     * Submit an externally-completed round result when the Game implementation
     * exposes a compatible API. Legacy Game flows continue to use finishRound().
     */
    async submitResult(result = {}) {
        if (
            typeof this.game?.submitResult ===
            "function"
        ) {
            const output =
                await this.game.submitResult(
                    result
                );

            this.render();
            return output;
        }

        if (
            typeof this.game?.completeRound ===
            "function"
        ) {
            const output =
                await this.game.completeRound(
                    result
                );

            this.render();
            return output;
        }

        throw new Error(
            "Dashboard game does not support result submission."
        );
    }


    nextRound() {
        return this.startRound();
    }


    resetShoe() {
        return this.startNewShoe();
    }


    mountQuickCardInput() {
        const root = this.root?.querySelector("[data-quick-card-root]");
        if (!root) return this;

        this.components.quickCardInput = createQuickCardInput({
            root,
            shoe: this.game.shoe,
            keyboard: true,
            mode: this.ui.quickInputMode,
            disabled: this.ui.busy ||
                !this.game.isManualRoundActive ||
                this.game.canFinishManualRound
        });

        return this;
    }

    get summary() {
        return {
            mounted: Boolean(this.root),
            busy: this.ui.busy,
            mode: this.ui.mode,
            state: this.game.state,
            manualState: this.game.manualState,
            burnConfirmed: Boolean(this.game.burnConfirmed),
            roundCount: this.game.roundCount ?? 0,
            hasAnalysis: Boolean(this.game.nextAnalysis),
            quickCardMounted: this.components.quickCardInput instanceof QuickCardInput,
            fastInput: true,
            keyboardShortcuts: true,
            autoSuit: this.ui.quickInputMode === QuickInputMode.AUTO,
            version: DASHBOARD_VERSION,
            liveDecisionVersion:
                DASHBOARD_LIVE_DECISION_VERSION,
            decisionCalibrationVersion:
                DASHBOARD_DECISION_CALIBRATION_VERSION,
            signalTrendVersion:
                DASHBOARD_SIGNAL_TREND_VERSION,
            exactOpportunityConfirmationVersion:
                DASHBOARD_EXACT_OPPORTUNITY_CONFIRMATION_VERSION,
            decisionStabilityExplainabilityVersion:
                DASHBOARD_DECISION_STABILITY_EXPLAINABILITY_VERSION,
            decisionIntelligenceSignalAttributionVersion:
                DASHBOARD_DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_VERSION,
            controllers: {
                game: this.gameController.summary,
                ui: this.uiController.summary,
                analysis: this.analysisController.summary,
                input: this.inputController.summary
            },
            liveCasino:
                this.liveCasino.summary,

            renderers: {
                dashboard: this.renderers.dashboard.summary,
                round: this.renderers.round.summary,
                history: this.renderers.history.summary,
                roadmap: this.renderers.roadmap.summary
            },
            casinoLayout: true,
            mobileSection: this.ui.mobileSection
        };
    }
}


function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export function renderAIClosedLoopPanel() {
    return `
        <section
            class="dashboard-section ai-panel"
            data-ai-closed-loop-panel
            aria-labelledby="ai-closed-loop-title"
        >
            <header class="dashboard-section__header">
                <div>
                    <p class="dashboard-section__eyebrow">V10.5</p>
                    <h2 id="ai-closed-loop-title">
                        AI Closed-Loop Intelligence · AI Live Decision Engine
                    </h2>
                    <p class="dashboard-section__description">
                        Probability → EV → Confidence → Risk → Ranking → Recommendation → Live Decision。
                    </p>
                </div>

                <div class="ai-status-badge" aria-live="polite">
                    <span class="ai-status-badge__label">系統狀態</span>
                    <strong data-ai-status>waiting-data</strong>
                </div>
            </header>

            <div class="ai-panel__grid">
                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">目前階段</span>
                    <strong class="ai-metric-card__value" data-ai-stage>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">模擬</span>
                    <strong class="ai-metric-card__value" data-ai-simulation>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">預測</span>
                    <strong class="ai-metric-card__value" data-ai-prediction>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">信心</span>
                    <strong class="ai-metric-card__value" data-ai-confidence>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">決策</span>
                    <strong class="ai-metric-card__value" data-ai-decision>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">策略</span>
                    <strong class="ai-metric-card__value" data-ai-strategy>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">下注計畫</span>
                    <strong class="ai-metric-card__value" data-ai-bet>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">執行</span>
                    <strong class="ai-metric-card__value" data-ai-execution>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">回饋</span>
                    <strong class="ai-metric-card__value" data-ai-feedback>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">學習</span>
                    <strong class="ai-metric-card__value" data-ai-learning>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">自適應</span>
                    <strong class="ai-metric-card__value" data-ai-adaptive>—</strong>
                </article>
            </div>

            <div
                class="ai-panel__error"
                data-ai-error
                role="alert"
                aria-live="assertive"
            ></div>

            <div class="ai-panel__actions">
                <button
                    class="button button--primary"
                    type="button"
                    data-ai-analyze
                >
                    AI 分析
                </button>

                <button
                    class="button button--success"
                    type="button"
                    data-ai-submit-result
                >
                    提交開牌結果
                </button>

                <button
                    class="button button--warning"
                    type="button"
                    data-ai-pause
                >
                    暫停
                </button>

                <button
                    class="button button--secondary"
                    type="button"
                    data-ai-resume
                    disabled
                >
                    繼續
                </button>

                <button
                    class="button button--danger"
                    type="button"
                    data-ai-reset
                >
                    重設
                </button>
            </div>
        </section>
    `;
}

export function renderDashboard({
    title = "Baccarat Analyzer",
    subtitle = "百家樂分析、機率、EV、路單與 AI Closed-Loop Intelligence"
} = {}) {
    return `
        <main
            class="page dashboard-page"
            data-page="dashboard"
            data-dashboard-version="${DASHBOARD_PAGE_VERSION}"
        >
            <header class="dashboard-hero">
                <div>
                    <p class="dashboard-hero__eyebrow">
                        Baccarat Analyzer
                    </p>

                    <h1 class="dashboard-hero__title">
                        ${escapeHTML(title)}
                    </h1>

                    <p class="dashboard-hero__subtitle">
                        ${escapeHTML(subtitle)}
                    </p>
                </div>

                <div class="dashboard-hero__meta">
                    <span>Dashboard</span>
                    <strong>V10.1</strong>
                </div>
            </header>

            <div class="dashboard-layout">
                <div class="dashboard-layout__main">
                    <section
                        class="dashboard-section"
                        data-dashboard-card-input
                        aria-labelledby="dashboard-card-input-title"
                    >
                        <header class="dashboard-section__header">
                            <div>
                                <p class="dashboard-section__eyebrow">
                                    Round Input
                                </p>

                                <h2 id="dashboard-card-input-title">
                                    牌局輸入
                                </h2>
                            </div>
                        </header>

                        <div
                            class="dashboard-mount"
                            data-component="card-input"
                        >
                            <p class="dashboard-placeholder">
                                CardInput 元件將掛載於此。
                            </p>
                        </div>
                    </section>

                    <section
                        class="dashboard-section"
                        data-dashboard-analysis
                        aria-labelledby="dashboard-analysis-title"
                    >
                        <header class="dashboard-section__header">
                            <div>
                                <p class="dashboard-section__eyebrow">
                                    Analysis
                                </p>

                                <h2 id="dashboard-analysis-title">
                                    機率、EV 與推薦
                                </h2>
                            </div>
                        </header>

                        <div class="dashboard-analysis-grid">
                            <div
                                class="dashboard-mount"
                                data-component="probability-table"
                            >
                                <p class="dashboard-placeholder">
                                    ProbabilityTable 元件將掛載於此。
                                </p>
                            </div>

                            <div
                                class="dashboard-mount"
                                data-component="ev-table"
                            >
                                <p class="dashboard-placeholder">
                                    EVTable 元件將掛載於此。
                                </p>
                            </div>

                            <div
                                class="dashboard-mount"
                                data-component="recommendation"
                            >
                                <p class="dashboard-placeholder">
                                    Recommendation 元件將掛載於此。
                                </p>
                            </div>
                        </div>
                    </section>

                    ${renderAIClosedLoopPanel()}

                    <section
                        class="dashboard-section"
                        data-dashboard-roadmap
                        aria-labelledby="dashboard-roadmap-title"
                    >
                        <header class="dashboard-section__header">
                            <div>
                                <p class="dashboard-section__eyebrow">
                                    Roadmap
                                </p>

                                <h2 id="dashboard-roadmap-title">
                                    路單
                                </h2>
                            </div>
                        </header>

                        <div
                            class="dashboard-mount"
                            data-component="roadmap"
                        >
                            <p class="dashboard-placeholder">
                                珠盤路、大路、大眼仔、小路與曱甴路將掛載於此。
                            </p>
                        </div>
                    </section>

                    <section
                        class="dashboard-section"
                        data-dashboard-statistics
                        aria-labelledby="dashboard-statistics-title"
                    >
                        <header class="dashboard-section__header">
                            <div>
                                <p class="dashboard-section__eyebrow">
                                    Statistics
                                </p>

                                <h2 id="dashboard-statistics-title">
                                    統計
                                </h2>
                            </div>
                        </header>

                        <div
                            class="dashboard-mount"
                            data-component="statistics"
                        >
                            <p class="dashboard-placeholder">
                                Statistics 與 Chart 元件將掛載於此。
                            </p>
                        </div>
                    </section>
                </div>

                <aside
                    class="dashboard-layout__sidebar"
                    aria-label="牌靴與資金資訊"
                >
                    <section
                        class="dashboard-section dashboard-section--compact"
                        data-dashboard-shoe-status
                    >
                        <header class="dashboard-section__header">
                            <h2>牌靴狀態</h2>
                        </header>

                        <div
                            class="dashboard-mount"
                            data-component="shoe-status"
                        >
                            <p class="dashboard-placeholder">
                                ShoeStatus 元件將掛載於此。
                            </p>
                        </div>
                    </section>

                    <section
                        class="dashboard-section dashboard-section--compact"
                        data-dashboard-remaining-cards
                    >
                        <header class="dashboard-section__header">
                            <h2>剩餘牌</h2>
                        </header>

                        <div
                            class="dashboard-mount"
                            data-component="remaining-cards"
                        >
                            <p class="dashboard-placeholder">
                                RemainingCards 元件將掛載於此。
                            </p>
                        </div>
                    </section>

                    <section
                        class="dashboard-section dashboard-section--compact"
                        data-dashboard-bankroll
                    >
                        <header class="dashboard-section__header">
                            <h2>資金管理</h2>
                        </header>

                        <div
                            class="dashboard-mount"
                            data-component="bankroll"
                        >
                            <p class="dashboard-placeholder">
                                Bankroll 與 KellyCard 元件將掛載於此。
                            </p>
                        </div>
                    </section>

                    <section
                        class="dashboard-section dashboard-section--compact"
                        data-dashboard-confidence
                    >
                        <header class="dashboard-section__header">
                            <h2>分析信心</h2>
                        </header>

                        <div
                            class="dashboard-mount"
                            data-component="confidence-bar"
                        >
                            <p class="dashboard-placeholder">
                                ConfidenceBar 元件將掛載於此。
                            </p>
                        </div>
                    </section>
                </aside>
            </div>
        </main>
    `;
}


/**
 * Dual-interface factory.
 *
 * Runtime mode:
 *   createDashboard({ root, game }) -> Dashboard instance
 *
 * Static/template mode:
 *   createDashboard() -> V10.1-compatible HTML string
 *   createDashboard({ title, subtitle }) -> HTML string
 */
export default function createDashboard(options = {}) {
    const runtimeMode =
        Object.prototype.hasOwnProperty.call(
            options,
            "root"
        ) ||
        Object.prototype.hasOwnProperty.call(
            options,
            "game"
        ) ||
        Object.prototype.hasOwnProperty.call(
            options,
            "gameOptions"
        ) ||
        Object.prototype.hasOwnProperty.call(
            options,
            "autoMount"
        );

    if (runtimeMode) {
        return new Dashboard(
            options
        );
    }

    return renderDashboard(
        options
    );
}

createDashboard.render =
    renderDashboard;

createDashboard.renderAIClosedLoopPanel =
    renderAIClosedLoopPanel;

createDashboard.version =
    DASHBOARD_PAGE_VERSION;

createDashboard.compatibilityVersion =
    DASHBOARD_COMPATIBILITY_VERSION;

createDashboard.liveDecisionVersion =
    DASHBOARD_LIVE_DECISION_VERSION;

createDashboard.decisionCalibrationVersion =
    DASHBOARD_DECISION_CALIBRATION_VERSION;

createDashboard.signalTrendVersion =
    DASHBOARD_SIGNAL_TREND_VERSION;

createDashboard.exactOpportunityConfirmationVersion =
    DASHBOARD_EXACT_OPPORTUNITY_CONFIRMATION_VERSION;

createDashboard.decisionStabilityExplainabilityVersion =
    DASHBOARD_DECISION_STABILITY_EXPLAINABILITY_VERSION;

createDashboard.decisionIntelligenceSignalAttributionVersion =
    DASHBOARD_DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_VERSION;

createDashboard.legacyVersion =
    DASHBOARD_VERSION;
