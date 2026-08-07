/**
 * Baccarat Analyzer V10.4.5
 * Path: tests/noCommissionBaccaratEV.test.js
 * Purpose: Verify No Commission Baccarat EV conversion end-to-end contracts.
 */
import EV, {
    EV_NO_COMMISSION_VERSION,
    DEFAULT_PAYOUT
} from "../analysis/ev.js";

import Analyzer, {
    ANALYZER_VERSION,
    ANALYZER_NO_COMMISSION_VERSION,
    ANALYZER_COMPATIBILITY_VERSION,
    BET_CONFIG
} from "../analysis/analyzer.js";

import {
    NO_COMMISSION_BACCARAT_VERSION,
    NO_COMMISSION_BACCARAT_RULES,
    NO_COMMISSION_PAYOUT
} from "../config/noCommissionBaccarat.js";

import {
    GAME_NO_COMMISSION_VERSION
} from "../engine/game.js";

import {
    DASHBOARD_RENDERER_NO_COMMISSION_VERSION
} from "../renderers/DashboardRenderer.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function approximatelyEqual(
    left,
    right,
    tolerance = 1e-12
) {
    return (
        Math.abs(
            left - right
        ) <= tolerance
    );
}


function probability() {
    return {
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
            0.0538
    };
}


export default async function noCommissionBaccaratEVTest() {
    const messages = [];

    assert(
        NO_COMMISSION_BACCARAT_VERSION ===
            "10.4.5" &&
        EV_NO_COMMISSION_VERSION ===
            "10.4.5" &&
        ANALYZER_VERSION ===
            "3.7.1" &&
        ANALYZER_NO_COMMISSION_VERSION ===
            "10.4.5" &&
        ANALYZER_COMPATIBILITY_VERSION ===
            "10.4.5.1" &&
        GAME_NO_COMMISSION_VERSION ===
            "10.4.5" &&
        DASHBOARD_RENDERER_NO_COMMISSION_VERSION ===
            "10.4.5",
        "V10.4.5.1 Analyzer / V10.4.5 No Commission version contract 錯誤"
    );

    messages.push(
        "✓ Analyzer V3.7.1 / V10.4.5 No Commission / V10.4.5.1 Compatibility contracts 正確"
    );


    assert(
        NO_COMMISSION_BACCARAT_RULES
            .playerNetOdds ===
            1 &&
        NO_COMMISSION_BACCARAT_RULES
            .bankerNormalNetOdds ===
            1 &&
        NO_COMMISSION_BACCARAT_RULES
            .bankerSixNetOdds ===
            0.5 &&
        NO_COMMISSION_BACCARAT_RULES
            .mainBetTiePush ===
            true,
        "免佣規則設定錯誤"
    );

    messages.push(
        "✓ Player 1:1 / Banker normal 1:1 / Banker 6 0.5:1 / Tie Push 正確"
    );


    assert(
        DEFAULT_PAYOUT.bankerNormal ===
            1 &&
        DEFAULT_PAYOUT.bankerSix ===
            0.5 &&
        NO_COMMISSION_PAYOUT
            .bankerNormal ===
            1 &&
        NO_COMMISSION_PAYOUT
            .bankerSix ===
            0.5,
        "免佣 payout contract 錯誤"
    );

    messages.push(
        "✓ No Commission payout contract 正確"
    );


    const p =
        probability();

    const ev =
        new EV();

    const expectedPlayer =
        p.player -
        p.banker;

    const expectedBanker =
        (
            p.banker -
            p.super6
        ) * 1 +
        p.super6 *
            0.5 -
        p.player;

    assert(
        approximatelyEqual(
            ev.player(p),
            expectedPlayer
        ),
        "Player EV 錯誤"
    );

    assert(
        approximatelyEqual(
            ev.banker(p),
            expectedBanker
        ),
        "Banker No Commission EV 錯誤"
    );

    assert(
        !approximatelyEqual(
            ev.banker(p),
            p.banker *
                0.95 -
            p.player
        ),
        "Banker EV 不應再使用 5% commission 公式"
    );

    messages.push(
        "✓ Banker EV 已完全脫離 0.95 commission 公式"
    );


    const components =
        ev.bankerComponents(p);

    assert(
        approximatelyEqual(
            components
                .normalBankerWin,
            p.banker -
                p.super6
        ) &&
        approximatelyEqual(
            components
                .bankerSix,
            p.super6
        ),
        "Banker normal / Banker 6 拆分錯誤"
    );

    messages.push(
        "✓ Banker normal win 與 Banker 6 probability 拆分正確"
    );


    const effectiveOdds =
        ev.effectiveBankerNetOdds(
            p
        );

    const rebuiltEV =
        p.banker *
            effectiveOdds -
        p.player;

    assert(
        approximatelyEqual(
            rebuiltEV,
            expectedBanker
        ),
        "Banker effective net odds 未保留 EV"
    );

    messages.push(
        "✓ Kelly / Risk compatibility odds 保持 No Commission EV 一致"
    );


    /*
     * V10.4.5.1 Analyzer is a Facade.
     *
     * Do not call:
     *
     *     Analyzer.prototype.buildBetInput.call({ ev }, ...)
     *
     * because the public Facade delegates to this.core.buildBetInput().
     * The compatibility test must exercise the real public runtime contract.
     */
    const analyzer =
        new Analyzer();

    const betInput =
        analyzer.buildBetInput(
            p
        );

    assert(
        approximatelyEqual(
            betInput.banker
                .netOdds,
            effectiveOdds
        ) &&
        betInput.banker
            .pushProbability ===
            p.tie &&
        betInput.player
            .netOdds ===
            1,
        "Analyzer Banker bet input 尚未切換免佣規則"
    );

    messages.push(
        "✓ Analyzer → Kelly / Risk Banker input 已使用免佣有效賠率"
    );


    assert(
        BET_CONFIG.banker
            .netOdds ===
            1 &&
        BET_CONFIG.banker
            .payoutRule ===
            "banker-6-half-pay",
        "Analyzer BET_CONFIG Banker 規則錯誤"
    );

    messages.push(
        "✓ Analyzer BET_CONFIG 已標記 Banker 6 half-pay"
    );


    let error =
        null;

    try {
        ev.banker({
            ...p,
            banker:
                0.04,
            super6:
                0.05
        });
    }
    catch (caught) {
        error =
            caught;
    }

    assert(
        error instanceof
            RangeError,
        "Super6 > Banker probability 應拒絕"
    );

    messages.push(
        "✓ 無效 Banker6 probability 防呆正確"
    );


    const json =
        ev.toJSON();

    assert(
        json.ruleset.id ===
            "no-commission-banker-6-half" &&
        json.payout
            .bankerSix ===
            0.5,
        "EV ruleset serialization 錯誤"
    );

    messages.push(
        "✓ EV ruleset serialization 正確"
    );


    return `
${messages.join("\n")}

No Commission Baccarat EV Conversion V10.4.5 測試完成

Ruleset：通過
Player EV：通過
Banker 6 Half-Pay EV：通過
Tie Push：通過
Commission Removal：通過
Kelly / Risk Compatibility Input：通過
Analyzer BET_CONFIG：通過
Validation：通過
Serialization：通過
`;
}
