/**
 * Baccarat Analyzer V10.10.0
 * Path: tests/compositionEdgeSelectiveBetting.test.js
 * Test Runner: tests/main.js
 */
import EV from "../analysis/ev.js";
import CompositionEdgeSelectiveBettingEngine, {
    COMPOSITION_EDGE_SELECTIVE_BETTING_VERSION,
    EIGHT_DECK_BASELINE
} from "../runtime/liveCasino/CompositionEdgeSelectiveBettingEngine.js";
import LiveCasinoUXController, {
    COMPOSITION_EDGE_SELECTIVE_BETTING_UX_VERSION
} from "../runtime/liveCasino/LiveCasinoUXController.js";
import {
    COMPOSITION_EDGE_SELECTIVE_BETTING_FACTORY_VERSION
} from "../runtime/liveCasino/createLiveCasinoUXController.js";
import {
    COMPOSITION_EDGE_SELECTIVE_BETTING_POLICY_VERSION
} from "../runtime/liveCasino/LiveCasinoPerformancePolicy.js";
import {
    COMPOSITION_EDGE_SELECTIVE_BETTING_STYLES_VERSION
} from "../runtime/liveCasino/LiveCasinoUXStyles.js";
import {
    DASHBOARD_COMPOSITION_EDGE_SELECTIVE_BETTING_VERSION
} from "../pages/dashboard.js";

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function close(left, right, tolerance = 1e-12) {
    return Math.abs(left - right) <= tolerance;
}

function probability(overrides = {}) {
    return {
        ...EIGHT_DECK_BASELINE,
        super6TwoCard: 0.037,
        super6ThreeCard: 0.016864,
        dragonBonusNaturalTie: 0.017871,
        playerDragonBonusNaturalWin: 0.12,
        playerDragonBonusMargin4: 0.06,
        playerDragonBonusMargin5: 0.04,
        playerDragonBonusMargin6: 0.025,
        playerDragonBonusMargin7: 0.02,
        playerDragonBonusMargin8: 0.01,
        playerDragonBonusMargin9: 0.015887,
        bankerDragonBonusNaturalWin: 0.12,
        bankerDragonBonusMargin4: 0.055,
        bankerDragonBonusMargin5: 0.038,
        bankerDragonBonusMargin6: 0.024,
        bankerDragonBonusMargin7: 0.018,
        bankerDragonBonusMargin8: 0.012,
        bankerDragonBonusMargin9: 0.015795,
        ...overrides
    };
}

function analysis(overrides = {}) {
    const p = probability(overrides);
    return {
        method: "exact",
        probability: p,
        exact: {probability: p},
        ev: new EV().all(p),
        evStatus: {
            player: "available",
            banker: "available",
            tie: "available",
            playerPair: "available",
            bankerPair: "available",
            super6: "available",
            playerDragonBonus: "available",
            bankerDragonBonus: "available"
        }
    };
}

export default async function compositionEdgeSelectiveBettingTest() {
    const messages = [];

    assert(
        COMPOSITION_EDGE_SELECTIVE_BETTING_VERSION === "10.10.0" &&
        COMPOSITION_EDGE_SELECTIVE_BETTING_UX_VERSION === "10.10.0" &&
        COMPOSITION_EDGE_SELECTIVE_BETTING_FACTORY_VERSION === "10.10.0" &&
        COMPOSITION_EDGE_SELECTIVE_BETTING_POLICY_VERSION === "10.10.0" &&
        COMPOSITION_EDGE_SELECTIVE_BETTING_STYLES_VERSION === "10.10.0" &&
        DASHBOARD_COMPOSITION_EDGE_SELECTIVE_BETTING_VERSION === "10.10.0",
        "V10.10 全層版本契約錯誤"
    );

    const dragonProbability = probability({
        playerDragonBonusNaturalWin: 0.10,
        playerDragonBonusMargin4: 0.10,
        playerDragonBonusMargin5: 0,
        playerDragonBonusMargin6: 0,
        playerDragonBonusMargin7: 0,
        playerDragonBonusMargin8: 0,
        playerDragonBonusMargin9: 0,
        dragonBonusNaturalTie: 0.05
    });
    assert(
        close(new EV().playerDragonBonus(dragonProbability), -0.55),
        "龍寶天牌／分差／和局退回的完整 EV 錯誤"
    );

    const neutral = new CompositionEdgeSelectiveBettingEngine({
        minimumEV: 10
    }).build({
        analysis: analysis(),
        decision: {action: "WAIT"},
        history: []
    });
    assert(
        neutral.compositionState === "基準盤" &&
        neutral.formal.action === "WAIT" &&
        neutral.specialPick === null,
        "基準盤不應硬製造特殊預測或下注"
    );

    const coherent = new CompositionEdgeSelectiveBettingEngine({
        minimumEV: 10,
        minimumDeviation: 0.001
    }).build({
        analysis: analysis({
            player: 0.47,
            banker: 0.435,
            tie: 0.095,
            playerDragonBonus: 0.31,
            bankerDragonBonus: 0.40
        }),
        decision: {action: "WAIT"},
        history: []
    });
    assert(
        coherent.mainPick.key === "player" &&
        coherent.specialPick?.key === "playerDragonBonus" &&
        !coherent.compatibleSpecialKeys.includes("bankerDragonBonus"),
        "主結果與龍寶特殊情境不可互相矛盾"
    );

    const engine = new CompositionEdgeSelectiveBettingEngine({
        minimumEV: 0.0025,
        unitSize: 1
    });
    const positive = engine.build({
        analysis: analysis({
            player: 0.43,
            banker: 0.48,
            tie: 0.09,
            super6: 0.08,
            super6TwoCard: 0.05,
            super6ThreeCard: 0.03,
            dragonBonusNaturalTie: 0,
            playerDragonBonusNaturalWin: 0,
            playerDragonBonusMargin4: 0,
            playerDragonBonusMargin5: 0,
            playerDragonBonusMargin6: 0,
            playerDragonBonusMargin7: 0,
            playerDragonBonusMargin8: 0,
            playerDragonBonusMargin9: 0,
            bankerDragonBonusNaturalWin: 0,
            bankerDragonBonusMargin4: 0,
            bankerDragonBonusMargin5: 0,
            bankerDragonBonusMargin6: 0,
            bankerDragonBonusMargin7: 0,
            bankerDragonBonusMargin8: 0,
            bankerDragonBonusMargin9: 0
        }),
        decision: {action: "WAIT"},
        history: []
    });
    assert(
        positive.formal.action === "BET" &&
        positive.formal.key === "super6" &&
        positive.formal.amount === 1 &&
        close(positive.formal.ev, 0.04),
        "正 EV Super 6 應成為選擇性下注"
    );

    const settled = engine.build({
        analysis: analysis(),
        decision: {action: "WAIT"},
        history: [{
            winner: "Banker",
            bankerScore: 6,
            super6: true,
            bankerDrewThirdCard: false
        }]
    });
    assert(
        settled.walkForward.settledBets === 1 &&
        settled.walkForward.profitUnits === 12,
        "walk-forward 必須只用下一局實際結果結算"
    );

    const game = {
        nextAnalysis: analysis(),
        history: [],
        roundCount: 8
    };
    const controller = new LiveCasinoUXController({game});
    const html = controller.renderDecisionHTML();
    assert(
        html.includes('data-prediction-version="10.10.0"') &&
        html.includes("組成優勢決策") &&
        html.includes("基準") &&
        html.includes("偏移"),
        "V10.10 首屏未呈現基準偏移與選擇性下注"
    );
    controller.destroy();

    messages.push("✓ 基準偏移、情境相容與完整龍寶 EV 正確");
    messages.push("✓ 正 EV 選擇性下注與 walk-forward 結算正確");
    messages.push("✓ V10.10 首屏不再硬選矛盾特殊項目");

    return `
${messages.join("\n")}

Composition Edge & Selective Betting Engine V10.10.0 測試完成

Baseline Edge：通過
Compatible Scenario：通過
Dragon Tier EV：通過
Selective Positive EV Bet：通過
No Forced Bet：通過
Walk-Forward Settlement：通過
Dashboard V10.10 UI：通過
`;
}
