/**
 * Baccarat Analyzer V3.3
 * components/QuickCardInput.js
 *
 * Casino Speed Input：
 *
 * 預設模式：
 * - 只按點數
 * - 自動選擇可用花色
 * - 立即送出 quick-card:select
 *
 * 精準模式：
 * - 長按／右鍵／切換按鈕後指定花色
 *
 * 鍵盤：
 * - A, 2-9, 0/T/1, J, Q, K：直接輸入點數
 * - Shift + 點數：保留點數並等待花色
 * - S/H/D/C：精準花色
 * - Esc：清除
 */

export const QUICK_CARD_RANKS = Object.freeze([
    "A", "2", "3", "4", "5", "6", "7",
    "8", "9", "10", "J", "Q", "K"
]);

export const QUICK_CARD_SUITS = Object.freeze([
    { key: "S", symbol: "♠", label: "黑桃", tone: "black" },
    { key: "H", symbol: "♥", label: "紅心", tone: "red" },
    { key: "D", symbol: "♦", label: "方塊", tone: "red" },
    { key: "C", symbol: "♣", label: "梅花", tone: "black" }
]);

export const QuickInputMode = Object.freeze({
    AUTO: "auto",
    PRECISE: "precise"
});

const RANK_HOTKEYS = Object.freeze({
    A: "A",
    "2": "2",
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    "7": "7",
    "8": "8",
    "9": "9",
    "0": "10",
    "1": "10",
    T: "10",
    J: "J",
    Q: "Q",
    K: "K"
});

const SUIT_HOTKEYS = Object.freeze({
    S: "S",
    H: "H",
    D: "D",
    C: "C"
});

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function isTypingTarget(target) {
    return target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable === true;
}

export class QuickCardInput {
    constructor({
        root = null,
        shoe = null,
        disabled = false,
        keyboard = true,
        mode = QuickInputMode.AUTO,
        autoMount = true
    } = {}) {
        this.root = typeof root === "string"
            ? document.querySelector(root)
            : root;

        this.shoe = shoe;
        this.disabled = Boolean(disabled);
        this.keyboard = Boolean(keyboard);
        this.mode = Object.values(QuickInputMode).includes(mode)
            ? mode
            : QuickInputMode.AUTO;

        this.selectedRank = null;
        this.lastCard = null;

        this.boundClick = event => this.handleClick(event);
        this.boundContextMenu = event => this.handleContextMenu(event);
        this.boundKeyDown = event => this.handleKeyDown(event);

        if (autoMount && this.root) {
            this.mount();
        }
    }

    mount(root = this.root) {
        if (!(root instanceof Element)) {
            throw new Error("QuickCardInput root is required.");
        }

        this.unbind();
        this.root = root;

        this.root.addEventListener("click", this.boundClick);
        this.root.addEventListener("contextmenu", this.boundContextMenu);

        if (this.keyboard) {
            window.addEventListener("keydown", this.boundKeyDown);
        }

        this.render();
        return this;
    }

    unbind() {
        this.root?.removeEventListener("click", this.boundClick);
        this.root?.removeEventListener("contextmenu", this.boundContextMenu);
        window.removeEventListener("keydown", this.boundKeyDown);
        return this;
    }

    destroy() {
        this.unbind();

        if (this.root) {
            this.root.innerHTML = "";
        }

        this.root = null;
        return this;
    }

    setShoe(shoe) {
        this.shoe = shoe;
        this.render();
        return this;
    }

    setDisabled(value) {
        this.disabled = Boolean(value);
        this.render();
        return this;
    }

    setMode(mode) {
        if (!Object.values(QuickInputMode).includes(mode)) {
            throw new Error(`Unknown QuickInput mode: ${mode}`);
        }

        this.mode = mode;
        this.selectedRank = null;
        this.render();
        return this;
    }

    setKeyboard(value) {
        this.keyboard = Boolean(value);
        window.removeEventListener("keydown", this.boundKeyDown);

        if (this.keyboard && this.root) {
            window.addEventListener("keydown", this.boundKeyDown);
        }

        this.render();
        return this;
    }

    getRankCount(rank) {
        return typeof this.shoe?.countByRank === "function"
            ? this.shoe.countByRank(rank)
            : null;
    }

    getSuitCount(rank, suit) {
        return typeof this.shoe?.countByRankAndSuit === "function"
            ? this.shoe.countByRankAndSuit(rank, suit)
            : null;
    }

    getAvailableSuit(rank) {
        for (const suit of QUICK_CARD_SUITS) {
            const remaining = this.getSuitCount(rank, suit.key);

            if (remaining === null || remaining > 0) {
                return suit.key;
            }
        }

        return null;
    }

    selectRank(rank, { precise = false } = {}) {
        if (!QUICK_CARD_RANKS.includes(rank)) {
            throw new Error(`Invalid rank: ${rank}`);
        }

        const remaining = this.getRankCount(rank);

        if (remaining !== null && remaining <= 0) {
            return false;
        }

        if (this.mode === QuickInputMode.AUTO && !precise) {
            const suit = this.getAvailableSuit(rank);

            if (!suit) {
                return false;
            }

            return this.submitCard(rank, suit, "auto");
        }

        this.selectedRank = rank;
        this.render();
        return true;
    }

    clearSelection() {
        this.selectedRank = null;
        this.render();
        return this;
    }

    submitSuit(suit) {
        if (!this.selectedRank) {
            return false;
        }

        return this.submitCard(
            this.selectedRank,
            suit,
            "precise"
        );
    }

    submitCard(rank, suit, source = "manual") {
        if (
            this.disabled ||
            !QUICK_CARD_RANKS.includes(rank) ||
            !QUICK_CARD_SUITS.some(item => item.key === suit)
        ) {
            return false;
        }

        const remaining = this.getSuitCount(rank, suit);

        if (remaining !== null && remaining <= 0) {
            return false;
        }

        const detail = {
            rank,
            suit,
            source
        };

        this.lastCard = { ...detail };

        this.root.dispatchEvent(
            new CustomEvent("quick-card:select", {
                bubbles: true,
                detail
            })
        );

        this.selectedRank = null;
        this.render();

        return true;
    }

    handleClick(event) {
        if (this.disabled) {
            return;
        }

        const modeButton = event.target.closest("[data-quick-mode]");
        if (modeButton && this.root?.contains(modeButton)) {
            this.setMode(modeButton.dataset.quickMode);
            return;
        }

        const clearButton = event.target.closest("[data-quick-clear]");
        if (clearButton && this.root?.contains(clearButton)) {
            this.clearSelection();
            return;
        }

        const rankButton = event.target.closest("[data-quick-rank]");
        if (rankButton && this.root?.contains(rankButton)) {
            this.selectRank(rankButton.dataset.quickRank);
            return;
        }

        const suitButton = event.target.closest("[data-quick-suit]");
        if (suitButton && this.root?.contains(suitButton)) {
            this.submitSuit(suitButton.dataset.quickSuit);
        }
    }

    handleContextMenu(event) {
        const rankButton = event.target.closest("[data-quick-rank]");

        if (
            !rankButton ||
            !this.root?.contains(rankButton) ||
            this.disabled
        ) {
            return;
        }

        event.preventDefault();

        this.selectedRank = rankButton.dataset.quickRank;
        this.render();
    }

    handleKeyDown(event) {
        if (
            this.disabled ||
            !this.root ||
            isTypingTarget(event.target)
        ) {
            return;
        }

        if (event.key === "Escape") {
            if (this.selectedRank) {
                event.preventDefault();
                this.clearSelection();
            }
            return;
        }

        const key = event.key.toUpperCase();

        if (this.selectedRank) {
            const suit = SUIT_HOTKEYS[key];

            if (suit) {
                event.preventDefault();
                this.submitSuit(suit);
                return;
            }
        }

        const rank = RANK_HOTKEYS[key];

        if (rank) {
            event.preventDefault();
            this.selectRank(rank, {
                precise: event.shiftKey
            });
        }
    }

    render() {
        if (!this.root) {
            return this;
        }

        const preciseStage =
            this.mode === QuickInputMode.PRECISE ||
            Boolean(this.selectedRank);

        this.root.innerHTML = `
            <section
                class="quickCardInput casinoFastInput v33FastInput"
                aria-label="V3.3 一鍵快速牌面輸入"
                data-mode="${this.mode}"
                data-stage="${preciseStage ? "suit" : "rank"}"
            >
                <header class="quickCardHeader">
                    <div>
                        <strong>
                            ${preciseStage
                                ? `指定 ${escapeHTML(this.selectedRank ?? "")} 的花色`
                                : "一鍵輸入點數"}
                        </strong>

                        <small>
                            ${this.mode === QuickInputMode.AUTO
                                ? "按點數立即加入；右鍵或 Shift＋點數可指定花色"
                                : "先選點數，再選花色"}
                        </small>
                    </div>

                    <div class="v33InputModeSwitch">
                        <button
                            type="button"
                            class="${this.mode === QuickInputMode.AUTO ? "active" : ""}"
                            data-quick-mode="auto"
                        >
                            自動花色
                        </button>

                        <button
                            type="button"
                            class="${this.mode === QuickInputMode.PRECISE ? "active" : ""}"
                            data-quick-mode="precise"
                        >
                            指定花色
                        </button>
                    </div>
                </header>

                <div class="quickRankGrid">
                    ${QUICK_CARD_RANKS.map(rank => {
                        const count = this.getRankCount(rank);
                        const unavailable = count !== null && count <= 0;

                        return `
                            <button
                                type="button"
                                class="quickRankCard ${this.selectedRank === rank ? "selected" : ""}"
                                data-quick-rank="${rank}"
                                aria-pressed="${this.selectedRank === rank}"
                                ${this.disabled || unavailable ? "disabled" : ""}
                            >
                                <strong>${rank}</strong>
                                ${count !== null ? `<small>${count}</small>` : ""}
                            </button>
                        `;
                    }).join("")}
                </div>

                ${preciseStage
                    ? `
                        <div class="v33PreciseBar">
                            <span>
                                已選：
                                <strong>${escapeHTML(this.selectedRank ?? "")}</strong>
                            </span>

                            <button
                                type="button"
                                data-quick-clear
                            >
                                清除 Esc
                            </button>
                        </div>

                        <div class="quickSuitGrid">
                            ${QUICK_CARD_SUITS.map(suit => {
                                const count = this.selectedRank
                                    ? this.getSuitCount(this.selectedRank, suit.key)
                                    : null;

                                const unavailable = !this.selectedRank ||
                                    (count !== null && count <= 0);

                                return `
                                    <button
                                        type="button"
                                        class="quickSuitCard ${suit.tone}"
                                        data-quick-suit="${suit.key}"
                                        ${this.disabled || unavailable ? "disabled" : ""}
                                    >
                                        <strong>${suit.symbol}</strong>
                                        <span>${suit.label}</span>
                                        <kbd>${suit.key}</kbd>
                                        ${count !== null ? `<small>${count}</small>` : ""}
                                    </button>
                                `;
                            }).join("")}
                        </div>
                    `
                    : `
                        <div class="v33AutoHint">
                            <strong>自動花色已啟用</strong>
                            <span>系統會使用該點數第一張可用花色。</span>
                        </div>
                    `}
            </section>
        `;

        return this;
    }

    get summary() {
        return {
            mode: this.mode,
            selectedRank: this.selectedRank,
            lastCard: this.lastCard ? { ...this.lastCard } : null,
            disabled: this.disabled,
            keyboard: this.keyboard,
            autoSuit: this.mode === QuickInputMode.AUTO
        };
    }
}

export default function createQuickCardInput(options = {}) {
    return new QuickCardInput(options);
}
