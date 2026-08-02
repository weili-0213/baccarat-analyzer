/**
 * Baccarat Analyzer V3
 * components/StatusPanel.js
 */

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function cardText(card) {
    if (!card) return "未確認";
    if (typeof card.toString === "function") return card.toString();
    const symbols = { S: "♠", H: "♥", D: "♦", C: "♣" };
    return `${card.rank ?? ""}${symbols[card.suit] ?? card.suit ?? ""}`;
}

export default class StatusPanel {
    constructor({ game = null } = {}) {
        this.game = game;
    }

    setGame(game) {
        this.game = game;
        return this;
    }

    render() {
        const game = this.game ?? {};
        const burn = game.burnInfo?.indicator;
        const observable =
            game.observableRemainingCards ??
            game.shoe?.observableRemaining ??
            game.shoe?.remaining ??
            0;
        const physical =
            game.remainingCards ??
            game.shoe?.physicalRemaining ??
            observable;

        return `
            <section class="v3StatusStrip dashboardCard" aria-label="牌靴狀態">
                ${this.item("牌靴", `#${game.shoeNumber ?? 0}`)}
                ${this.item("可觀察", observable)}
                ${this.item("物理剩餘", physical)}
                ${this.item("燒牌", game.burnConfirmed ? cardText(burn) : "未確認")}
                ${this.item("局數", game.roundCount ?? game.history?.count ?? 0)}
                ${this.item("分析", game.analysisSummary?.state ?? game.analysisState ?? "IDLE")}
            </section>
        `;
    }

    item(label, value) {
        return `
            <div class="v3StatusItem">
                <span>${escapeHTML(label)}</span>
                <strong>${escapeHTML(value)}</strong>
            </div>
        `;
    }
}
