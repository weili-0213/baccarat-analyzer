/**
 * Baccarat Analyzer V3.4.3
 * pages/dashboard.js
 *
 * Casino Dashboard Controller
 *
 * - 單頁快速操作
 * - 手機三區切換
 * - 自動花色／指定花色輸入
 * - 快速／完整分析模式
 * - History 與 Roadmap
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


export const DASHBOARD_VERSION = "3.4.3";

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


    startNewShoe() {
        return this.inputController
            .startNewShoe();
    }

    confirmBurn() {
        return this.analysisController
            .confirmBurn();
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

    finishRound() {
        return this.inputController
            .finishRound();
    }

    analyze() {
        return this.analysisController
            .analyze();
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

        return this;
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
            controllers: {
                game: this.gameController.summary,
                ui: this.uiController.summary,
                analysis: this.analysisController.summary,
                input: this.inputController.summary
            },
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

export default function createDashboard(options = {}) {
    return new Dashboard(options);
}
