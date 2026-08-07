/**
 * Baccarat Analyzer V10.4.4
 * Path: components/AnalysisPanel.js
 * Purpose:
 *   Unified probability + EV panel for live casino use.
 *   Removes the duplicated Side Bet Reference section and keeps Dragon Bonus
 *   rows inside the Full Probability & EV section.
 */
export const ANALYSIS_PANEL_LIVE_VERSION = "10.4.4";

export const AnalysisDisplayMode = Object.freeze({
    QUICK: "quick",
    FULL: "full"
});

const LABELS = Object.freeze({
    player: "閒",
    banker: "莊",
    tie: "和",
    playerPair: "閒對",
    bankerPair: "莊對",
    super6: "幸運 6",
    playerDragonBonus: "閒龍寶",
    bankerDragonBonus: "莊龍寶"
});

const FULL_NAMES = Object.freeze([
    "player",
    "banker",
    "tie",
    "playerPair",
    "bankerPair",
    "super6",
    "playerDragonBonus",
    "bankerDragonBonus"
]);

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function percent(value) {
    return Number.isFinite(value)
        ? `${(value * 100).toFixed(2)}%`
        : "—";
}

function number(value) {
    return Number.isFinite(value)
        ? value.toFixed(4)
        : "—";
}

function sideProbability(side = {}, name) {
    const item = side?.[name] ?? {};

    return (
        Number.isFinite(item.probability)
            ? item.probability
            : Number.isFinite(item.winProbability)
                ? item.winProbability
                : null
    );
}

export default class AnalysisPanel {
    constructor({
        analysis = null,
        mode = AnalysisDisplayMode.QUICK,
        busy = false
    } = {}) {
        this.analysis = analysis;
        this.mode = mode;
        this.busy = Boolean(busy);
    }

    setData({
        analysis = this.analysis,
        mode = this.mode,
        busy = this.busy
    } = {}) {
        this.analysis = analysis;
        this.mode = mode;
        this.busy = Boolean(busy);
        return this;
    }

    render() {
        if (this.busy) {
            return `
                <section class="dashboardCard v3AnalysisPanel">
                    <header class="v3PanelHeader">
                        <div><small>ANALYSIS</small><h2>背景分析中</h2></div>
                        <span class="v3Badge warning">計算中</span>
                    </header>
                    <div class="v3Skeleton"></div>
                </section>
            `;
        }

        if (!this.analysis) {
            return `
                <section class="dashboardCard v3AnalysisPanel">
                    <header class="v3PanelHeader">
                        <div><small>ANALYSIS</small><h2>下一局分析</h2></div>
                    </header>
                    <p class="v3Empty">尚未產生分析。</p>
                    <button type="button" class="button secondary full" data-action="analyze">
                        立即分析
                    </button>
                </section>
            `;
        }

        const probability = this.analysis.probability ?? {};
        const ev = this.analysis.ev ?? {};

        return `
            <section class="dashboardCard v3AnalysisPanel">
                <header class="v3PanelHeader">
                    <div>
                        <small>ANALYSIS</small>
                        <h2>下一局分析</h2>
                    </div>
                    <span class="v3AnalysisRound">
                        第 ${escapeHTML(this.analysis.generatedAfterRound ?? 0)} 局後
                    </span>
                </header>

                <div class="v3MainMetrics">
                    ${this.metric("player", probability.player, ev.player)}
                    ${this.metric("banker", probability.banker, ev.banker)}
                    ${this.metric("tie", probability.tie, ev.tie)}
                </div>

                ${this.mode === AnalysisDisplayMode.FULL
                    ? this.renderFull()
                    : ""}

                <div class="v3PanelActions">
                    <button type="button" class="button secondary" data-action="analyze">
                        重新分析
                    </button>
                </div>
            </section>
        `;
    }

    metric(name, probability, ev) {
        return `
            <div class="v3Metric ${name}">
                <span>${LABELS[name]}</span>
                <strong>${percent(probability)}</strong>
                <small class="${Number(ev) >= 0 ? "positive" : "negative"}">
                    EV ${number(ev)}
                </small>
            </div>
        `;
    }

    renderFull() {
        const analysis = this.analysis ?? {};
        const probability = analysis.probability ?? {};
        const ev = analysis.ev ?? {};
        const status = analysis.evStatus ?? {};
        const side = analysis.sideBetAnalysis ?? {};

        return `
            <div class="v3FullAnalysis v1044UnifiedFullAnalysis">
                <section>
                    <h3>完整機率與 EV</h3>
                    <div class="v3DataGrid">
                        ${FULL_NAMES.map(name => {
                            const probabilityValue =
                                Number.isFinite(probability[name])
                                    ? probability[name]
                                    : sideProbability(side, name);

                            const unavailable =
                                status[name] === "unavailable" ||
                                side?.[name]?.available === false;

                            return `
                                <div class="v1044FullMetric ${name}">
                                    <span>${LABELS[name]}</span>
                                    <strong>${percent(probabilityValue)}</strong>
                                    <small>
                                        ${unavailable
                                            ? "EV 尚不可用"
                                            : `EV ${number(ev[name])}`}
                                    </small>
                                </div>
                            `;
                        }).join("")}
                    </div>
                </section>
            </div>
        `;
    }
}
