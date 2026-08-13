/**
 * Baccarat Analyzer V10.10.0
 * Path: runtime/liveCasino/CompositionEdgeSelectiveBettingEngine.js
 * Purpose: Compare exact remaining-shoe probabilities with an eight-deck
 * baseline, enforce compatible scenarios, and release only positive-EV bets.
 */
import FifteenSecondEightMarketPredictionEngine, {
    EIGHT_PREDICTION_MARKETS
} from "./FifteenSecondEightMarketPredictionEngine.js";

export const COMPOSITION_EDGE_SELECTIVE_BETTING_VERSION = "10.10.0";

export const EIGHT_DECK_BASELINE = Object.freeze({
    player: 0.44624660934900956,
    banker: 0.4585974226389493,
    tie: 0.09515596802577196,
    playerPair: 0.07469879518238492,
    bankerPair: 0.07469879518239239,
    super6: 0.05386371585899708,
    playerDragonBonus: 0.2898870255124195,
    bankerDragonBonus: 0.2827947340724091
});

export const DEFAULT_V1010_PAYTABLE = Object.freeze({
    player: 1,
    bankerNormal: 1,
    bankerSix: 0.5,
    tie: 8,
    playerPair: 11,
    bankerPair: 11,
    super6: 12,
    dragonBonus: Object.freeze({
        naturalWin: 1,
        margin4: 1,
        margin5: 2,
        margin6: 4,
        margin7: 6,
        margin8: 10,
        margin9: 30
    })
});

const COMPATIBLE_SPECIALS = Object.freeze({
    player: new Set(["playerPair", "bankerPair", "playerDragonBonus"]),
    banker: new Set(["playerPair", "bankerPair", "super6", "bankerDragonBonus"]),
    tie: new Set(["playerPair", "bankerPair"])
});

function finite(value) {
    return Number.isFinite(value) ? value : null;
}

function winnerKey(result = {}) {
    const winner = String(result.winner ?? "").toLowerCase();
    return ["player", "banker", "tie"].includes(winner)
        ? winner
        : result.playerWin ? "player" : result.bankerWin ? "banker" : result.tie ? "tie" : null;
}

function resultMargin(result = {}) {
    return Math.abs(
        finite(result.margin) ??
        ((finite(result.playerScore) ?? 0) - (finite(result.bankerScore) ?? 0))
    );
}

function dragonEV(probability, side, payout) {
    const keys = [
        `${side}DragonBonusNaturalWin`,
        ...[4, 5, 6, 7, 8, 9].map(m => `${side}DragonBonusMargin${m}`),
        "dragonBonusNaturalTie"
    ];
    if (!keys.every(key => Number.isFinite(probability[key]))) {
        return null;
    }

    const naturalWin = probability[`${side}DragonBonusNaturalWin`];
    const naturalTie = probability.dragonBonusNaturalTie;
    let win = naturalWin;
    let value = naturalWin * payout.naturalWin;
    for (const margin of [4, 5, 6, 7, 8, 9]) {
        const chance = probability[`${side}DragonBonusMargin${margin}`];
        win += chance;
        value += chance * payout[`margin${margin}`];
    }
    return value - Math.max(0, 1 - win - naturalTie);
}

function marketEV(key, probability, paytable, suppliedEV = {}) {
    if (key === "playerDragonBonus" || key === "bankerDragonBonus") {
        return dragonEV(
            probability,
            key.startsWith("player") ? "player" : "banker",
            paytable.dragonBonus
        );
    }
    if (key === "banker") {
        const banker = probability.banker;
        const player = probability.player;
        const six = probability.super6;
        if (![banker, player, six].every(Number.isFinite)) return null;
        return (banker - six) * paytable.bankerNormal +
            six * paytable.bankerSix - player;
    }
    if (key === "super6" &&
        Number.isFinite(paytable.super6TwoCard) &&
        Number.isFinite(paytable.super6ThreeCard) &&
        Number.isFinite(probability.super6TwoCard) &&
        Number.isFinite(probability.super6ThreeCard)) {
        const win = probability.super6TwoCard + probability.super6ThreeCard;
        return probability.super6TwoCard * paytable.super6TwoCard +
            probability.super6ThreeCard * paytable.super6ThreeCard - (1 - win);
    }
    if (Number.isFinite(suppliedEV[key])) return suppliedEV[key];
    const chance = probability[key];
    const odds = paytable[key];
    return Number.isFinite(chance) && Number.isFinite(odds)
        ? chance * odds - (1 - chance)
        : null;
}

function unitReturn(key, result, paytable) {
    const winner = winnerKey(result);
    if (["player", "banker", "tie"].includes(key)) {
        if (winner === "tie" && key !== "tie") return 0;
        if (winner !== key) return -1;
        if (key === "banker" && result.bankerScore === 6) return paytable.bankerSix;
        return key === "banker" ? paytable.bankerNormal : paytable[key];
    }
    if (key === "playerPair" || key === "bankerPair") {
        return result[key] === true ? paytable[key] : -1;
    }
    if (key === "super6") {
        if (!(result.super6 || (winner === "banker" && result.bankerScore === 6))) return -1;
        const count = result.banker?.count ?? (result.bankerDrewThirdCard ? 3 : 2);
        return count === 2 && Number.isFinite(paytable.super6TwoCard)
            ? paytable.super6TwoCard
            : count === 3 && Number.isFinite(paytable.super6ThreeCard)
                ? paytable.super6ThreeCard
                : paytable.super6;
    }
    const side = key.startsWith("player") ? "player" : "banker";
    const natural = result[`${side}Natural`] === true;
    if (winner === "tie" && result.playerNatural && result.bankerNatural) return 0;
    if (winner !== side) return -1;
    if (natural) return paytable.dragonBonus.naturalWin;
    const margin = resultMargin(result);
    return margin >= 4 ? paytable.dragonBonus[`margin${margin}`] ?? -1 : -1;
}

export default class CompositionEdgeSelectiveBettingEngine {
    constructor({
        minimumEV = 0.0025,
        minimumDeviation = 0.001,
        unitSize = 1,
        baseline = {},
        paytable = {},
        ...legacyOptions
    } = {}) {
        this.minimumEV = minimumEV;
        this.minimumDeviation = minimumDeviation;
        this.unitSize = unitSize;
        this.baseline = {...EIGHT_DECK_BASELINE, ...baseline};
        this.paytable = {
            ...DEFAULT_V1010_PAYTABLE,
            ...paytable,
            dragonBonus: {
                ...DEFAULT_V1010_PAYTABLE.dragonBonus,
                ...(paytable.dragonBonus ?? {})
            }
        };
        this.legacy = new FifteenSecondEightMarketPredictionEngine(legacyOptions);
        this.decisionWindowMs = this.legacy.decisionWindowMs;
        this.pending = null;
        this.audit = [];
    }

    settlePending(rounds) {
        if (!this.pending || rounds.length < this.pending.targetRound) return;
        const result = rounds[this.pending.targetRound - 1];
        if (result) {
            const returned = unitReturn(this.pending.key, result, this.paytable);
            this.audit.push({...this.pending, returned});
            if (this.audit.length > 60) this.audit.shift();
        }
        this.pending = null;
    }

    build(input = {}) {
        const legacy = this.legacy.build(input);
        const rounds = Array.isArray(input.history)
            ? input.history
            : input.history?.getAll?.() ?? input.history?.rounds ?? [];
        this.settlePending(rounds);
        if (!legacy.ready) {
            return {...legacy, version: COMPOSITION_EDGE_SELECTIVE_BETTING_VERSION};
        }

        const probability = input.analysis?.probability ?? {};
        const suppliedEV = input.analysis?.ev ?? {};
        const markets = EIGHT_PREDICTION_MARKETS.map(definition => {
            const old = legacy.markets.find(item => item.key === definition.key) ?? {};
            const baselineProbability = this.baseline[definition.key];
            const deviation = probability[definition.key] - baselineProbability;
            const ev = marketEV(definition.key, probability, this.paytable, suppliedEV);
            return {
                ...old,
                ...definition,
                baselineProbability,
                deviation,
                relativeDeviation: baselineProbability > 0 ? deviation / baselineProbability : null,
                ev,
                evAvailable: Number.isFinite(ev),
                positiveEV: Number.isFinite(ev) && ev > 0,
                actionable: Number.isFinite(ev) && ev >= this.minimumEV,
                note: Number.isFinite(ev) ? null : "缺少完整分級機率或賠率"
            };
        });

        const mainMarkets = markets.filter(item => item.group === "main");
        const mainPick = [...mainMarkets].sort((a, b) => b.probability - a.probability)[0];
        const mainHasEdge = Math.abs(mainPick.deviation) >= this.minimumDeviation;
        const compatible = COMPATIBLE_SPECIALS[mainPick.key] ?? new Set();
        const specialCandidates = markets.filter(item =>
            item.group === "special" && compatible.has(item.key) &&
            (item.actionable || item.deviation >= this.minimumDeviation)
        );
        const specialPick = [...specialCandidates].sort((a, b) =>
            (b.actionable - a.actionable) || (b.ev - a.ev) || (b.deviation - a.deviation)
        )[0] ?? null;
        const actionable = markets.filter(item => item.actionable)
            .sort((a, b) => b.ev - a.ev);
        const selected = actionable[0] ?? null;
        const formal = selected ? {
            action: "BET",
            actionLabel: "選擇性下注",
            key: selected.key,
            label: selected.label,
            amount: this.unitSize,
            ev: selected.ev,
            reason: `${selected.label} Exact EV ${selected.ev >= 0 ? "+" : ""}${(selected.ev * 100).toFixed(2)}%，通過 ${(this.minimumEV * 100).toFixed(2)}% 門檻。`
        } : {
            action: "WAIT",
            actionLabel: "觀望",
            key: null,
            label: "不下注",
            amount: 0,
            ev: null,
            reason: `八項市場均未通過正 EV ${(this.minimumEV * 100).toFixed(2)}% 門檻。`
        };

        if (selected && (!this.pending || this.pending.targetRound !== rounds.length + 1)) {
            this.pending = {
                targetRound: rounds.length + 1,
                key: selected.key,
                label: selected.label,
                ev: selected.ev,
                amount: this.unitSize
            };
        }
        const profit = this.audit.reduce((sum, item) => sum + item.returned * item.amount, 0);

        return {
            ...legacy,
            version: COMPOSITION_EDGE_SELECTIVE_BETTING_VERSION,
            sourceLabel: "Exact 組成優勢",
            markets,
            mainPick,
            specialPick,
            formal,
            compositionState: mainHasEdge ? `偏${mainPick.shortLabel}` : "基準盤",
            mainHasEdge,
            compatibleSpecialKeys: [...compatible],
            message: selected
                ? `選擇性下注：${selected.label}；只有賠率後 Exact EV 過門檻才放行。`
                : `${mainHasEdge ? `組成偏向 ${mainPick.label}` : "目前接近整副牌基準"}；沒有可下注的正 EV，不硬湊訊號。`,
            overlapNotice: specialPick
                ? `${specialPick.label} 與 ${mainPick.label} 為相容情境；特殊項目不再以原始機率硬選。`
                : "目前沒有兼具情境相容與足夠偏移的特殊項目。",
            walkForward: {
                settledBets: this.audit.length,
                profitUnits: profit,
                wins: this.audit.filter(item => item.returned > 0).length,
                losses: this.audit.filter(item => item.returned < 0).length
            },
            paytable: this.paytable,
            baseline: this.baseline
        };
    }

    get summary() {
        return {
            version: COMPOSITION_EDGE_SELECTIVE_BETTING_VERSION,
            exactOnly: true,
            baseline: "eight-deck",
            minimumEV: this.minimumEV,
            minimumDeviation: this.minimumDeviation,
            paytable: this.paytable,
            markets: EIGHT_PREDICTION_MARKETS.map(item => item.key)
        };
    }
}
