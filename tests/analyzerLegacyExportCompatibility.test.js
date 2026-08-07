/**
 * Baccarat Analyzer V10.4.5.1
 * Path: tests/analyzerLegacyExportCompatibility.test.js
 * Purpose:
 *   Ensures V10.4.5 No Commission changes do not break the legacy
 *   Analyzer V3.7.1 public module contract.
 */

import Analyzer, {
    ANALYZER_VERSION,
    ANALYZER_NO_COMMISSION_VERSION,
    ANALYZER_COMPATIBILITY_VERSION,
    AnalysisMode,
    BET_CONFIG,
    MAIN_RECOMMENDATION_BETS,
    SIDE_BETS
} from "../analysis/analyzer.js";

import {
    ANALYZER_LEGACY_CORE_COMPATIBILITY_VERSION
} from "../analysis/AnalyzerLegacyCore.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


export default async function analyzerLegacyExportCompatibilityTest() {
    const messages = [];

    assert(
        ANALYZER_VERSION ===
            "3.7.1",
        "ANALYZER_VERSION 必須維持舊版 3.7.1 contract"
    );

    assert(
        ANALYZER_NO_COMMISSION_VERSION ===
            "10.4.5",
        "No Commission Analyzer version 錯誤"
    );

    assert(
        ANALYZER_COMPATIBILITY_VERSION ===
            "10.4.5.1" &&
        ANALYZER_LEGACY_CORE_COMPATIBILITY_VERSION ===
            "10.4.5.1",
        "V10.4.5.1 compatibility version 錯誤"
    );

    messages.push(
        "✓ Legacy / No Commission / Compatibility version contracts 正確"
    );


    assert(
        AnalysisMode.MONTE_CARLO ===
            "monteCarlo" &&
        AnalysisMode.EXACT ===
            "exact" &&
        AnalysisMode.HYBRID ===
            "hybrid",
        "AnalysisMode legacy exports 錯誤"
    );

    messages.push(
        "✓ AnalysisMode legacy export 正確"
    );


    assert(
        Array.isArray(
            MAIN_RECOMMENDATION_BETS
        ) &&
        MAIN_RECOMMENDATION_BETS.length ===
            3 &&
        MAIN_RECOMMENDATION_BETS.includes(
            "player"
        ) &&
        MAIN_RECOMMENDATION_BETS.includes(
            "banker"
        ) &&
        MAIN_RECOMMENDATION_BETS.includes(
            "tie"
        ),
        "MAIN_RECOMMENDATION_BETS legacy export 錯誤"
    );

    assert(
        Array.isArray(
            SIDE_BETS
        ) &&
        SIDE_BETS.includes(
            "playerPair"
        ) &&
        SIDE_BETS.includes(
            "bankerPair"
        ) &&
        SIDE_BETS.includes(
            "super6"
        ) &&
        SIDE_BETS.includes(
            "playerDragonBonus"
        ) &&
        SIDE_BETS.includes(
            "bankerDragonBonus"
        ),
        "SIDE_BETS legacy export 錯誤"
    );

    messages.push(
        "✓ MAIN_RECOMMENDATION_BETS / SIDE_BETS legacy exports 正確"
    );


    assert(
        BET_CONFIG.banker
            .netOdds ===
            1 &&
        BET_CONFIG.banker
            .payoutRule ===
            "banker-6-half-pay" &&
        BET_CONFIG.banker
            .pushKey ===
            "tie",
        "Banker BET_CONFIG 尚未保持免佣莊6半賠"
    );

    messages.push(
        "✓ Legacy BET_CONFIG 已保留 No Commission Banker 6 half-pay"
    );


    const analyzer =
        new Analyzer();

    assert(
        analyzer &&
        analyzer.core &&
        analyzer.coordinator &&
        analyzer.pipelineManager,
        "Analyzer Facade / Core / Coordinator / PipelineManager 建立錯誤"
    );

    assert(
        analyzer.summary.version ===
            "3.7.1" &&
        analyzer.summary.facade ===
            true &&
        analyzer.summary
            .noCommissionVersion ===
            "10.4.5" &&
        analyzer.summary
            .compatibilityVersion ===
            "10.4.5.1",
        "Analyzer summary compatibility metadata 錯誤"
    );

    messages.push(
        "✓ Analyzer V3.7.1 Facade runtime contract 正確"
    );


    const probability = {
        player:
            0.4462,

        banker:
            0.4586,

        tie:
            0.0952,

        playerPair:
            0.0741,

        bankerPair:
            0.0749,

        super6:
            0.0538,

        playerDragonBonus:
            0.031,

        bankerDragonBonus:
            0.034
    };

    const expectedBankerEV =
        (
            probability.banker -
            probability.super6
        ) * 1 +
        probability.super6 *
            0.5 -
        probability.player;

    const bankerEV =
        analyzer.core.ev
            .banker(
                probability
            );

    assert(
        Math.abs(
            bankerEV -
            expectedBankerEV
        ) < 1e-12,
        "Legacy Facade Core 的 Banker EV 不是免佣莊6半賠"
    );

    const betInput =
        analyzer.buildBetInput(
            probability
        );

    assert(
        Number.isFinite(
            betInput.banker
                .netOdds
        ) &&
        betInput.banker
            .netOdds !==
            0.95,
        "Legacy Facade Kelly/Risk Banker input 不可回退到 0.95 commission"
    );

    assert(
        Math.abs(
            probability.banker *
                betInput.banker
                    .netOdds -
            probability.player -
            expectedBankerEV
        ) < 1e-12,
        "Legacy Facade Banker effective odds 未保持免佣 EV"
    );

    messages.push(
        "✓ Legacy Facade runtime 仍使用 No Commission EV / effective Banker odds"
    );


    return `
${messages.join("\n")}

Analyzer Legacy Export Compatibility Fix V10.4.5.1 測試完成

ANALYZER_VERSION：通過
ANALYZER_NO_COMMISSION_VERSION：通過
AnalysisMode：通過
MAIN_RECOMMENDATION_BETS：通過
SIDE_BETS：通過
BET_CONFIG：通過
Facade Runtime：通過
No Commission EV Regression：通過
Kelly / Risk Compatibility：通過
`;
}
