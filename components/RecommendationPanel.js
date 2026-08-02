/**
 * Baccarat Analyzer V3
 * components/RecommendationPanel.js
 */

const LABELS = Object.freeze({
    player: "閒",
    banker: "莊",
    tie: "和"
});

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function money(value) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("zh-TW", {
        maximumFractionDigits: 0
    }).format(value);
}

function percent(value) {
    return Number.isFinite(value)
        ? `${(value * 100).toFixed(1)}%`
        : "—";
}

export default class RecommendationPanel {
    constructor({
        analysis = null,
        mode = "quick",
        minBet = 100,
        maxBet = 10000
    } = {}) {
        this.analysis = analysis;
        this.mode = mode;
        this.minBet = minBet;
        this.maxBet = maxBet;
    }

    setData(options = {}) {
        Object.assign(this, options);
        return this;
    }

    render() {
        if (!this.analysis) {
            return `
                <section class="dashboardCard v3RecommendationPanel empty">
                    <small>RECOMMENDATION</small>
                    <h2>等待分析</h2>
                    <p>完成燒牌後會產生下一局建議。</p>
                </section>
            `;
        }

        const recommendation = this.analysis.recommendation ?? {};
        const best = this.analysis.best ?? null;
        const shouldBet =
            this.analysis.shouldBet ??
            recommendation.shouldBet ??
            false;

        const betKey = recommendation.bet ?? best?.name ?? null;
        const label = shouldBet
            ? (recommendation.label ?? LABELS[betKey] ?? "主注")
            : "不下注";

        const amount = shouldBet && Number.isFinite(recommendation.amount)
            ? Math.min(this.maxBet, Math.max(this.minBet, recommendation.amount))
            : 0;

        const message =
            recommendation.message ??
            (shouldBet
                ? "此主注通過目前的 EV、可信度與風險條件。"
                : "目前沒有符合條件的正期望主注。");

        return `
            <section class="dashboardCard v3RecommendationPanel ${shouldBet ? "bet" : "skip"}">
                <small>RECOMMENDATION</small>
                <div class="v3RecommendationHeadline">
                    <div>
                        <span>${shouldBet ? "建議下注" : "建議觀望"}</span>
                        <h2>${escapeHTML(label)}</h2>
                    </div>

                    ${shouldBet
                        ? `<strong class="v3BetAmount">${money(amount)}</strong>`
                        : ""}
                </div>

                <p>${escapeHTML(message)}</p>

                ${this.mode === "full"
                    ? `
                        <div class="v3RecommendationMeta">
                            <span>信心 ${percent(this.analysis.overallConfidence)}</span>
                            <span>最低 ${money(this.minBet)}</span>
                            <span>最高 ${money(this.maxBet)}</span>
                        </div>
                    `
                    : ""}
            </section>
        `;
    }
}
