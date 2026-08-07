/**
 * Baccarat Analyzer V10.4.4
 * Path: components/StatusPanel.js
 * Purpose:
 *   Compact shoe status + next-round analysis summary in one live row.
 */
export const STATUS_PANEL_LIVE_VERSION = "10.4.4";

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function cardText(card) {
    if (!card) return "未確認";
    if (
        typeof card.toString === "function" &&
        card.toString !== Object.prototype.toString
    ) {
        return card.toString();
    }

    const symbols = {
        S: "♠",
        H: "♥",
        D: "♦",
        C: "♣"
    };

    return `${card.rank ?? ""}${symbols[card.suit] ?? card.suit ?? ""}`;
}

function percent(value) {
    return Number.isFinite(value)
        ? `${(value * 100).toFixed(2)}%`
        : "—";
}

function ev(value) {
    return Number.isFinite(value)
        ? `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`
        : "—";
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

        const analysis =
            game.nextAnalysis ??
            null;

        const probability =
            analysis?.probability ??
            {};

        const expectedValue =
            analysis?.ev ??
            {};

        const analysisState =
            game.analysisSummary?.state ??
            game.analysisState ??
            "IDLE";

        return `
            <section
                class="v3StatusStrip dashboardCard v1044StatusStrip"
                aria-label="牌靴狀態與下一局分析"
            >
                <div class="v1044ShoeMeta">
                    ${this.item("牌靴", `#${game.shoeNumber ?? 0}`)}
                    ${this.item("可觀察", observable)}
                    ${this.item("物理剩餘", physical)}
                    ${this.item("燒牌", game.burnConfirmed ? cardText(burn) : "未確認")}
                    ${this.item("局數", game.roundCount ?? game.history?.count ?? 0)}
                    ${this.item("分析", analysisState)}
                </div>

                <div class="v1044NextAnalysis" data-next-analysis-summary>
                    <span class="v1044NextLabel">下一局</span>
                    ${this.analysisItem("閒", "player", probability.player, expectedValue.player)}
                    ${this.analysisItem("莊", "banker", probability.banker, expectedValue.banker)}
                    ${this.analysisItem("和", "tie", probability.tie, expectedValue.tie)}
                </div>
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

    analysisItem(label, side, probability, expectedValue) {
        return `
            <div class="v1044NextItem ${side}">
                <strong>${escapeHTML(label)} ${percent(probability)}</strong>
                <small>EV ${ev(expectedValue)}</small>
            </div>
        `;
    }
}
