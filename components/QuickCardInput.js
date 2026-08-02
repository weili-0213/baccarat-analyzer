/**
 * Baccarat Analyzer V3.1
 * components/QuickCardInput.js
 *
 * Casino Fast Input：
 *
 * - 點數 → 花色 → 自動送出
 * - 鍵盤快捷鍵
 * - Escape 清除點數
 * - 手機大按鍵
 *
 * 點數快捷鍵：
 * A, 2-9, 0/1/T = 10, J, Q, K
 *
 * 花色快捷鍵：
 * S = 黑桃, H = 紅心, D = 方塊, C = 梅花
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
        autoMount = true
    } = {}) {
        this.root = typeof root === "string"
            ? document.querySelector(root)
            : root;

        this.shoe = shoe;
        this.disabled = Boolean(disabled);
        this.keyboard = Boolean(keyboard);
        this.selectedRank = null;
        this.lastCard = null;

        this.boundClick = event => this.handleClick(event);
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

        if (this.keyboard) {
            window.addEventListener("keydown", this.boundKeyDown);
        }

        this.render();
        return this;
    }

    unbind() {
        this.root?.removeEventListener("click", this.boundClick);
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

    setKeyboard(value) {
        const enabled = Boolean(value);

        if (enabled === this.keyboard) {
            return this;
        }

        this.keyboard = enabled;
        window.removeEventListener("keydown", this.boundKeyDown);

        if (enabled && this.root) {
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

    selectRank(rank) {
        if (!QUICK_CARD_RANKS.includes(rank)) {
            throw new Error(`Invalid rank: ${rank}`);
        }

        const remaining = this.getRankCount(rank);

        if (remaining !== null && remaining <= 0) {
            return this;
        }

        this.selectedRank = rank;
        this.render();
        return this;
    }

    clearSelection() {
        this.selectedRank = null;
        this.render();
        return this;
    }

    submitSuit(suit) {
        if (
            this.disabled ||
            !this.selectedRank ||
            !QUICK_CARD_SUITS.some(item => item.key === suit)
        ) {
            return false;
        }

        const remaining = this.getSuitCount(this.selectedRank, suit);

        if (remaining !== null && remaining <= 0) {
            return false;
        }

        const detail = {
            rank: this.selectedRank,
            suit
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

        if (!this.selectedRank) {
            const rank = RANK_HOTKEYS[key];

            if (rank) {
                event.preventDefault();
                this.selectRank(rank);
            }

            return;
        }

        const suit = SUIT_HOTKEYS[key];

        if (suit) {
            event.preventDefault();
            this.submitSuit(suit);
            return;
        }

        const replacementRank = RANK_HOTKEYS[key];

        if (replacementRank) {
            event.preventDefault();
            this.selectRank(replacementRank);
        }
    }

    render() {
        if (!this.root) {
            return this;
        }

        this.root.innerHTML = `
            <section
                class="quickCardInput casinoFastInput"
                aria-label="賭場快速牌面輸入"
                data-stage="${this.selectedRank ? "suit" : "rank"}"
            >
                <header class="quickCardHeader">
                    <div>
                        <strong>
                            ${this.selectedRank
                                ? `第 2 步：選 ${escapeHTML(this.selectedRank)} 的花色`
                                : "第 1 步：選牌面點數"}
                        </strong>

                        <small>
                            ${this.keyboard
                                ? (
                                    this.selectedRank
                                        ? "快捷鍵：S / H / D / C"
                                        : "快捷鍵：A、2-9、0、J、Q、K"
                                )
                                : "點數 → 花色 → 自動加入"}
                        </small>
                    </div>

                    ${this.selectedRank
                        ? `
                            <button
                                type="button"
                                class="quickCardClear"
                                data-quick-clear
                            >
                                清除 Esc
                            </button>
                        `
                        : ""}
                </header>

                <div class="quickStageIndicator" aria-hidden="true">
                    <span class="${!this.selectedRank ? "active" : "done"}">1 點數</span>
                    <i></i>
                    <span class="${this.selectedRank ? "active" : ""}">2 花色</span>
                </div>

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
            </section>
        `;

        return this;
    }

    get summary() {
        return {
            selectedRank: this.selectedRank,
            lastCard: this.lastCard ? { ...this.lastCard } : null,
            disabled: this.disabled,
            keyboard: this.keyboard,
            stage: this.selectedRank ? "suit" : "rank"
        };
    }
}

export default function createQuickCardInput(options = {}) {
    return new QuickCardInput(options);
}
