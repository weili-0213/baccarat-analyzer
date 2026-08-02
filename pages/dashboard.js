/**
 * Baccarat Analyzer V3
 * pages/dashboard.js
 *
 * 單頁快速操作 Dashboard。
 */

import Game, {
    GameState,
    ManualRoundState
} from "../engine/game.js";

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


export const DashboardMode = AnalysisDisplayMode;

export const DashboardSection = Object.freeze({
    INPUT: "input",
    INSIGHT: "insight",
    ROADMAP: "roadmap"
});

const RANKS = Object.freeze([
    "A", "2", "3", "4", "5", "6", "7",
    "8", "9", "10", "J", "Q", "K"
]);

const SUITS = Object.freeze([
    { value: "S", symbol: "♠", label: "黑桃" },
    { value: "H", symbol: "♥", label: "紅心" },
    { value: "D", symbol: "♦", label: "方塊" },
    { value: "C", symbol: "♣", label: "梅花" }
]);

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function loadMode() {
    try {
        const saved = localStorage.getItem("baccarat.dashboardMode");
        if (Object.values(DashboardMode).includes(saved)) {
            return saved;
        }
    }
    catch {
        // ignore
    }
    return DashboardMode.QUICK;
}

function saveMode(mode) {
    try {
        localStorage.setItem("baccarat.dashboardMode", mode);
    }
    catch {
        // ignore
    }
}

function cardText(card) {
    if (!card) return "—";
    if (typeof card.toString === "function") return card.toString();
    const symbol = SUITS.find(item => item.value === card.suit)?.symbol ?? card.suit ?? "";
    return `${card.rank ?? ""}${symbol}`;
}

function getManualCards(game) {
    return Array.isArray(game?.manualCards) ? game.manualCards : [];
}

function winnerLabel(winner) {
    return winner === "Player" ? "閒"
        : winner === "Banker" ? "莊"
        : winner === "Tie" ? "和"
        : "—";
}

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

        this.ui = {
            busy: false,
            message: "",
            messageType: "",
            selectedRank: "A",
            selectedSuit: "S",
            mode: loadMode(),
            activeRoad: "beadRoad",
            mobileSection: DashboardSection.INPUT,
            quickInputMode: QuickInputMode.AUTO
        };

        this.components = {
            quickCardInput: null,
            statusPanel: new StatusPanel({ game: this.game }),
            analysisPanel: new AnalysisPanel(),
            recommendationPanel: new RecommendationPanel()
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
        if (!Object.values(DashboardMode).includes(mode)) {
            throw new Error(`Unknown dashboard mode: ${mode}`);
        }

        this.ui.mode = mode;
        saveMode(mode);
        this.render();
        return this;
    }

    setMobileSection(section) {
        if (!Object.values(DashboardSection).includes(section)) {
            throw new Error(`Unknown dashboard section: ${section}`);
        }

        this.ui.mobileSection = section;
        this.render();
        return this;
    }

    setMessage(message, type = "info") {
        this.ui.message = String(message ?? "");
        this.ui.messageType = type;
        return this;
    }

    clearMessage() {
        this.ui.message = "";
        this.ui.messageType = "";
        return this;
    }

    async runAction(callback, { successMessage = "", renderBefore = true } = {}) {
        if (this.ui.busy) return null;

        this.ui.busy = true;
        this.clearMessage();
        if (renderBefore) this.render();

        try {
            const result = await callback();
            if (successMessage) this.setMessage(successMessage, "success");
            return result;
        }
        catch (error) {
            console.error("Dashboard action failed", error);
            this.setMessage(error?.message ?? String(error), "error");
            return null;
        }
        finally {
            this.ui.busy = false;
            this.render();
        }
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
                this.ui.activeRoad = button.dataset.road ?? "beadRoad";
                this.render();
                break;
        }
    }

    handleChange(event) {
        if (event.target.name === "card-rank") {
            this.ui.selectedRank = event.target.value;
        }
        if (event.target.name === "card-suit") {
            this.ui.selectedSuit = event.target.value;
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

            if (getManualCards(this.game).length > 0) {
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
        return this.runAction(
            async () => this.game.startNewShoe({ clearHistory: true, shuffle: true }),
            { successMessage: "已建立新牌靴，請輸入燒牌指示牌。" }
        );
    }

    async confirmBurn() {
        return this.runAction(async () => {
            this.game.confirmBurnIndicator({
                rank: this.ui.selectedRank,
                suit: this.ui.selectedSuit
            });

            if (!this.game.hasNextAnalysis) {
                await this.game.analyzeNextRound();
            }
            else {
                await this.game.waitForAnalysis();
            }
        }, {
            successMessage: "燒牌已確認，第一局分析完成。"
        });
    }

    async startRound() {
        this.ui.mobileSection = DashboardSection.INPUT;

        return this.runAction(
            async () => this.game.startManualRound(),
            { successMessage: "已開始輸入本局牌面。" }
        );
    }

    async addSelectedCard({ rank, suit }) {
        return this.runAction(async () => {
            const side = this.game.nextManualSide;
            if (!side) throw new Error("目前不需要再輸入牌。");
            this.game.addManualCard(side, { rank, suit });
        }, {
            renderBefore: false
        });
    }

    async undoCard() {
        return this.runAction(async () => {
            const removed = this.game.undoManualCard();
            if (!removed) throw new Error("目前沒有可復原的牌。");
        }, {
            successMessage: "已復原最後一張牌。"
        });
    }

    async cancelRound() {
        return this.runAction(
            async () => this.game.cancelManualRound(),
            { successMessage: "已取消本局輸入。" }
        );
    }

    async finishRound() {
        return this.runAction(
            async () => this.game.finishManualRound({ analyze: true }),
            { successMessage: "本局已確認，下一局分析已更新。" }
        );
    }

    async analyze() {
        return this.runAction(
            async () => this.game.analyzeNextRound(),
            { successMessage: "下一局分析完成。" }
        );
    }

    render() {
        if (!this.root) return this;

        this.components.quickCardInput?.destroy();
        this.components.quickCardInput = null;

        const analysis = this.game.nextAnalysis ?? null;

        this.components.statusPanel.setGame(this.game);
        this.components.analysisPanel.setData({
            analysis,
            mode: this.ui.mode,
            busy: this.game.isAnalyzing
        });
        this.components.recommendationPanel.setData({
            analysis,
            mode: this.ui.mode,
            minBet: 100,
            maxBet: 10000
        });

        this.root.innerHTML = `
            <main
                class="dashboardV3 dashboardV32"
                data-mobile-section="${escapeHTML(this.ui.mobileSection)}"
            >
                ${this.renderHeader()}
                ${this.renderMessage()}
                ${this.components.statusPanel.render()}
                ${this.renderMobileNavigation()}

                <div class="v32CasinoGrid">
                    <section
                        class="v32InputZone"
                        data-v32-section="input"
                    >
                        ${this.renderRoundPanel()}
                    </section>

                    <section
                        class="v32InsightZone"
                        data-v32-section="insight"
                    >
                        ${this.components.recommendationPanel.render()}
                        ${this.components.analysisPanel.render()}
                    </section>

                    <aside class="v32HistoryZone">
                        ${this.renderHistoryPanel()}
                    </aside>

                    <section
                        class="v32RoadZone"
                        data-v32-section="roadmap"
                    >
                        ${this.renderRoadmapPanel()}
                    </section>
                </div>
            </main>
        `;

        this.mountQuickCardInput();
        return this;
    }

    renderMobileNavigation() {
        const items = [
            {
                section: DashboardSection.INPUT,
                label: "輸牌",
                hint: this.game.isManualRoundActive ? "本局輸入中" : "牌局操作"
            },
            {
                section: DashboardSection.INSIGHT,
                label: "分析",
                hint: this.game.nextAnalysis ? "建議已更新" : "等待分析"
            },
            {
                section: DashboardSection.ROADMAP,
                label: "路單",
                hint: `${this.game.roundCount ?? 0} 局`
            }
        ];

        return `
            <nav class="v32MobileNav" aria-label="手機 Dashboard 區域">
                ${items.map(item => `
                    <button
                        type="button"
                        class="${this.ui.mobileSection === item.section ? "active" : ""}"
                        data-action="set-mobile-section"
                        data-section="${item.section}"
                    >
                        <strong>${item.label}</strong>
                        <small>${item.hint}</small>
                    </button>
                `).join("")}
            </nav>
        `;
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

    renderHeader() {
        return `
            <header class="v3Header dashboardCard">
                <div>
                    <small>BACCARAT ANALYZER V3</small>
                    <h1>百家樂分析儀</h1>
                </div>

                <div class="v3HeaderActions">
                    <span class="v31FastBadge" title="Casino Fast Input 已啟用">
                        FAST INPUT
                    </span>

                    <div class="v3ModeSwitch" role="group" aria-label="分析模式">
                        ${this.modeButton("quick", "快速")}
                        ${this.modeButton("full", "完整")}
                    </div>

                    <button
                        type="button"
                        class="button primary"
                        data-action="new-shoe"
                        ${this.ui.busy ? "disabled" : ""}
                    >
                        新牌靴
                    </button>
                </div>
            </header>
        `;
    }

    modeButton(mode, label) {
        return `
            <button
                type="button"
                class="${this.ui.mode === mode ? "active" : ""}"
                data-action="set-dashboard-mode"
                data-mode="${mode}"
            >
                ${label}
            </button>
        `;
    }

    renderMessage() {
        if (!this.ui.message) return "";

        return `
            <div class="v3Message ${escapeHTML(this.ui.messageType)}" role="status">
                <span>${escapeHTML(this.ui.message)}</span>
                <button type="button" data-action="clear-message">×</button>
            </div>
        `;
    }

    renderRoundPanel() {
        if (!this.game.burnConfirmed) {
            return this.renderBurnPanel();
        }

        if (
            !this.game.isManualRoundActive &&
            this.game.manualState !== ManualRoundState.FINISHED
        ) {
            return `
                <section class="dashboardCard v3RoundPanel">
                    <header class="v3PanelHeader">
                        <div><small>ROUND</small><h2>等待下一局</h2></div>
                        <span class="v3Badge">READY</span>
                    </header>

                    <button
                        type="button"
                        class="button primary full"
                        data-action="start-round"
                        ${this.game.canStartManualRound && !this.ui.busy ? "" : "disabled"}
                    >
                        開始輸入本局
                    </button>
                </section>
            `;
        }

        if (this.game.manualState === ManualRoundState.FINISHED) {
            return `
                <section class="dashboardCard v3RoundPanel">
                    <header class="v3PanelHeader">
                        <div><small>ROUND</small><h2>本局完成</h2></div>
                        <span class="v3Badge success">${winnerLabel(this.game.winner)}勝</span>
                    </header>

                    ${this.renderHands()}

                    <button
                        type="button"
                        class="button primary full"
                        data-action="start-round"
                        ${this.game.canStartManualRound && !this.ui.busy ? "" : "disabled"}
                    >
                        開始輸入下一局
                    </button>
                </section>
            `;
        }

        const ready = this.game.canFinishManualRound;
        const next = this.game.nextManualInput;

        return `
            <section class="dashboardCard v3RoundPanel">
                <header class="v3PanelHeader">
                    <div>
                        <small>ROUND</small>
                        <h2>${ready ? "本局牌面完成" : escapeHTML(next?.label ?? "輸入牌面")}</h2>
                    </div>
                    <span class="v3Badge ${ready ? "success" : "warning"}">
                        ${ready ? "可確認" : "輸入中"}
                    </span>
                </header>

                ${this.renderHands()}

                ${ready ? "" : `<div data-quick-card-root></div>`}

                <div class="v31ShortcutHint">
                    <span>Backspace 復原</span>
                    <span>Esc 取消</span>
                    ${ready ? "<span>Enter 確認</span>" : ""}
                </div>

                <div class="v3RoundActions">
                    ${ready
                        ? `<button type="button" class="button primary" data-action="finish-round">確認本局</button>`
                        : ""}

                    <button
                        type="button"
                        class="button secondary"
                        data-action="undo-card"
                        ${getManualCards(this.game).length === 0 ? "disabled" : ""}
                    >
                        復原一張
                    </button>

                    <button type="button" class="button danger" data-action="cancel-round">
                        取消本局
                    </button>
                </div>
            </section>
        `;
    }

    renderBurnPanel() {
        const rankOptions = RANKS.map(rank => `
            <option value="${rank}" ${rank === this.ui.selectedRank ? "selected" : ""}>
                ${rank}
            </option>
        `).join("");

        const suitOptions = SUITS.map(suit => `
            <option value="${suit.value}" ${suit.value === this.ui.selectedSuit ? "selected" : ""}>
                ${suit.symbol} ${suit.label}
            </option>
        `).join("");

        return `
            <section class="dashboardCard v3RoundPanel">
                <header class="v3PanelHeader">
                    <div><small>BURN</small><h2>輸入燒牌指示牌</h2></div>
                    <span class="v3Badge warning">等待輸入</span>
                </header>

                <div class="v3BurnSelector">
                    <label>
                        <span>點數</span>
                        <select name="card-rank">${rankOptions}</select>
                    </label>

                    <label>
                        <span>花色</span>
                        <select name="card-suit">${suitOptions}</select>
                    </label>

                    <div class="v3BurnPreview">
                        ${escapeHTML(this.ui.selectedRank)}
                        ${SUITS.find(item => item.value === this.ui.selectedSuit)?.symbol ?? ""}
                    </div>
                </div>

                <button type="button" class="button primary full" data-action="confirm-burn">
                    確認燒牌
                </button>
            </section>
        `;
    }

    renderHands() {
        const progress = this.game.manualProgress ?? {};

        return `
            <div class="v3Hands">
                ${this.renderHand("player", "閒家", progress.playerCards ?? [], progress.playerScore)}
                ${this.renderHand("banker", "莊家", progress.bankerCards ?? [], progress.bankerScore)}
            </div>
        `;
    }

    renderHand(side, label, cards, score) {
        return `
            <section class="v3Hand ${side}">
                <header>
                    <strong>${label}</strong>
                    <span>${Number.isFinite(score) ? `${score} 點` : "—"}</span>
                </header>

                <div>
                    ${[0, 1, 2].map(index => `
                        <span class="${cards[index] ? "filled" : ""}">
                            ${cards[index] ? escapeHTML(cardText(cards[index])) : "—"}
                        </span>
                    `).join("")}
                </div>
            </section>
        `;
    }

    renderHistoryPanel() {
        const rounds = typeof this.game.history?.lastRounds === "function"
            ? this.game.history.lastRounds(20)
            : [];

        return `
            <section class="dashboardCard v3HistoryPanel">
                <header class="v3PanelHeader">
                    <div><small>HISTORY</small><h2>最近牌局</h2></div>
                </header>

                ${rounds.length
                    ? `<div class="v3HistoryRoad">
                        ${rounds.map(result => `
                            <span class="${String(result.winner ?? "").toLowerCase()}">
                                ${winnerLabel(result.winner)}
                            </span>
                        `).join("")}
                    </div>`
                    : `<p class="v3Empty">尚無牌局紀錄。</p>`}
            </section>
        `;
    }

    renderRoadmapPanel() {
        const labels = {
            beadRoad: "珠盤路",
            bigRoad: "大路",
            bigEyeRoad: "大眼仔",
            smallRoad: "小路",
            cockroachRoad: "曱甴路"
        };

        const roads = this.game.roadmapViewModel?.roads ?? this.game.roadMatrices ?? {};
        const matrix = roads[this.ui.activeRoad] ?? [];

        return `
            <section class="dashboardCard v3RoadmapPanel">
                <div class="v3RoadTabs">
                    ${Object.entries(labels).map(([key, label]) => `
                        <button
                            type="button"
                            class="${key === this.ui.activeRoad ? "active" : ""}"
                            data-action="select-road"
                            data-road="${key}"
                        >
                            ${label}
                        </button>
                    `).join("")}
                </div>

                <div class="v3RoadViewport">
                    ${this.renderRoadMatrix(matrix)}
                </div>
            </section>
        `;
    }

    renderRoadMatrix(matrix) {
        if (!Array.isArray(matrix) || matrix.length === 0) {
            return `<p class="v3Empty">尚無路單資料。</p>`;
        }

        const rows = matrix.length;
        const columns = Math.max(0, ...matrix.map(row => Array.isArray(row) ? row.length : 0));
        const cells = [];

        for (let column = 0; column < columns; column++) {
            for (let row = 0; row < rows; row++) {
                const cell = matrix[row]?.[column] ?? null;
                const winner = String(cell?.winner ?? cell?.result ?? cell?.value ?? "").toLowerCase();
                const className = winner.includes("player") ? "player"
                    : winner.includes("banker") ? "banker"
                    : winner.includes("tie") ? "tie"
                    : cell ? "derived" : "empty";

                cells.push(`<span class="${className}"></span>`);
            }
        }

        return `
            <div
                class="v3RoadMatrix"
                style="--road-rows:${rows};--road-columns:${columns}"
            >
                ${cells.join("")}
            </div>
        `;
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
            casinoLayout: true,
            mobileSection: this.ui.mobileSection
        };
    }
}

export default function createDashboard(options = {}) {
    return new Dashboard(options);
}
