/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Monte Carlo Engine v2 Test
 *
 * 測試：
 *
 * 1. MonteCarlo 建立與設定
 * 2. Shoe 驗證
 * 3. calculateSync()
 * 4. 非同步 calculate()
 * 5. 主結果機率總和
 * 6. 所有事件機率範圍
 * 7. 樣本數與統計次數
 * 8. 新版 Shoe 剩餘牌欄位
 * 9. 未知燒牌
 * 10. onProgress
 * 11. AbortSignal
 * 12. 可重現亂數
 * 13. 同步與非同步結果一致
 * 14. 不修改原始 Shoe
 * 15. clone()、setOptions()、summary、toJSON()
 */

import MonteCarlo
    from "../analysis/monteCarlo.js";

import Shoe
    from "../engine/shoe.js";

import Card
    from "../engine/card.js";


/**
 * 斷言工具
 */
function assert(
    condition,
    message
) {

    if (!condition) {

        throw new Error(
            message
        );

    }

}


/**
 * 浮點數近似比較
 */
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


/**
 * 建立可重現亂數產生器
 *
 * Linear Congruential Generator
 */
function createSeededRandom(
    seed = 123456789
) {

    let state =
        seed >>> 0;

    return function random() {

        state = (

            (
                state * 1664525
            ) +

            1013904223

        ) >>> 0;

        return (
            state /
            4294967296
        );

    };

}


/**
 * 建立測試牌靴
 *
 * 使用 12 張牌，確保各種發牌分支皆有足夠牌數。
 */
function createTestShoe() {

    const shoe =
        new Shoe(1);

    shoe.cards = [

        new Card("A", "S", 1),
        new Card("A", "H", 1),

        new Card("2", "D", 1),
        new Card("3", "C", 1),

        new Card("4", "S", 1),
        new Card("5", "H", 1),

        new Card("6", "D", 1),
        new Card("7", "C", 1),

        new Card("8", "S", 1),
        new Card("9", "H", 1),

        new Card("10", "D", 1),
        new Card("K", "C", 1)

    ];

    shoe.discarded = [];

    shoe.burned = [];

    shoe.unknownBurnedCount = 0;

    return shoe;

}


/**
 * 建立含未知燒牌的測試牌靴
 */
function createUnknownBurnShoe() {

    const shoe =
        createTestShoe();

    shoe.unknownBurnedCount = 2;

    return shoe;

}


/**
 * 取得 Shoe 快照
 */
function snapshotShoe(shoe) {

    return JSON.stringify(
        shoe.toJSON()
    );

}


/**
 * 檢查機率範圍
 */
function assertProbabilityRange(
    probability
) {

    for (
        const [
            name,
            value
        ] of Object.entries(
            probability
        )
    ) {

        assert(
            Number.isFinite(value),
            `${name} 必須是有限數字`
        );

        assert(
            value >= 0 &&
            value <= 1,
            `${name} 必須介於 0～1`
        );

    }

}


/**
 * 檢查兩組計數是否完全一致
 */
function assertCountersEqual(
    left,
    right
) {

    const names =
        Object.keys(left);

    assert(
        names.length ===
            Object.keys(right).length,
        "兩組 counters 欄位數不同"
    );

    for (
        const name of
        names
    ) {

        assert(
            left[name] ===
                right[name],
            `${name} 計數不一致`
        );

    }

}


/**
 * Monte Carlo v2 完整測試
 */
export default async function monteCarloV2Test() {

    const messages = [];


    /**
     * 1. 無 Shoe 也可以先建立引擎。
     */
    const emptyEngine =
        new MonteCarlo();

    assert(
        emptyEngine instanceof
            MonteCarlo,
        "MonteCarlo 建立失敗"
    );

    assert(
        emptyEngine.shoe === null,
        "空引擎的 shoe 應為 null"
    );

    messages.push(
        "✓ MonteCarlo 可在沒有 Shoe 時建立"
    );


    /**
     * 2. 沒有 Shoe 時執行應報錯。
     */
    let missingShoeError =
        null;

    try {

        emptyEngine.calculateSync({
            simulations: 10
        });

    }
    catch (error) {

        missingShoeError =
            error;

    }

    assert(
        missingShoeError instanceof Error,
        "沒有 Shoe 時應拋出錯誤"
    );

    messages.push(
        "✓ 沒有 Shoe 時會拒絕模擬"
    );


    /**
     * 3. 建立正式引擎。
     */
    const shoe =
        createTestShoe();

    const engine =
        new MonteCarlo(
            {
                shoe
            },
            {
                simulations: 300,
                batchSize: 25
            }
        );

    assert(
        engine.shoe === shoe,
        "MonteCarlo 沒有保存 Shoe"
    );

    assert(
        engine.options.simulations ===
            300,
        "simulations 設定失敗"
    );

    assert(
        engine.options.batchSize ===
            25,
        "batchSize 設定失敗"
    );

    messages.push(
        "✓ MonteCarlo context 與 options 正確"
    );


    /**
     * 4. 同步計算不可修改原 Shoe。
     */
    const syncSeed =
        20260802;

    const beforeSync =
        snapshotShoe(shoe);

    const syncResult =
        engine.calculateSync({

            simulations:
                300,

            random:
                createSeededRandom(
                    syncSeed
                )

        });

    const afterSync =
        snapshotShoe(shoe);

    assert(
        beforeSync === afterSync,
        "calculateSync() 不應修改原始 Shoe"
    );

    assert(
        syncResult.method ===
            "monteCarlo",
        "同步結果 method 應為 monteCarlo"
    );

    messages.push(
        "✓ calculateSync() 可執行且不修改 Shoe"
    );


    /**
     * 5. 主結果機率總和。
     */
    const mainTotal =

        syncResult.probability.player +

        syncResult.probability.banker +

        syncResult.probability.tie;

    assert(
        approximatelyEqual(
            mainTotal,
            1
        ),
        "Player + Banker + Tie 必須等於 1"
    );

    assert(
        approximatelyEqual(
            syncResult.mainTotal,
            1
        ),
        "mainTotal 必須等於 1"
    );

    messages.push(
        "✓ Player、Banker、Tie 機率總和為 1"
    );


    /**
     * 6. 所有事件機率範圍與欄位。
     */
    assertProbabilityRange(
        syncResult.probability
    );

    const expectedEvents = [

        "player",
        "banker",
        "tie",

        "playerPair",
        "bankerPair",
        "eitherPair",

        "super6",

        "playerNatural",
        "bankerNatural",
        "natural",

        "big",
        "small",

        "playerDragonBonus",
        "bankerDragonBonus"

    ];

    for (
        const name of
        expectedEvents
    ) {

        assert(
            Object.hasOwn(
                syncResult.probability,
                name
            ),
            `缺少事件機率：${name}`
        );

        assert(
            Object.hasOwn(
                syncResult.counts,
                name
            ),
            `缺少事件計數：${name}`
        );

    }

    messages.push(
        "✓ 所有主要與側注事件機率有效"
    );


    /**
     * 7. 樣本數與計數總和。
     */
    assert(
        syncResult.simulations === 300,
        "simulations 輸出錯誤"
    );

    assert(
        syncResult.sampleSize === 300,
        "sampleSize 輸出錯誤"
    );

    assert(
        syncResult.samples === 300,
        "samples 輸出錯誤"
    );

    assert(
        (
            syncResult.counts.player +
            syncResult.counts.banker +
            syncResult.counts.tie
        ) === 300,
        "主結果計數總和必須等於模擬次數"
    );

    messages.push(
        "✓ 樣本數與主結果計數正確"
    );


    /**
     * 8. 新版 Shoe 剩餘牌欄位。
     */
    assert(
        syncResult.remainingCards ===
            shoe.physicalRemaining,
        "remainingCards 應等於 physicalRemaining"
    );

    assert(
        syncResult.observableRemaining ===
            shoe.observableRemaining,
        "observableRemaining 輸出錯誤"
    );

    assert(
        syncResult.physicalRemaining ===
            shoe.physicalRemaining,
        "physicalRemaining 輸出錯誤"
    );

    assert(
        syncResult.unknownBurnedCount ===
            shoe.unknownBurnedCount,
        "unknownBurnedCount 輸出錯誤"
    );

    messages.push(
        "✓ 新版 Shoe 剩餘牌欄位正確"
    );


    /**
     * 9. 未知燒牌狀態。
     */
    const unknownBurnShoe =
        createUnknownBurnShoe();

    const unknownBurnEngine =
        new MonteCarlo(
            {
                shoe:
                    unknownBurnShoe
            },
            {
                simulations: 50,
                batchSize: 10
            }
        );

    const unknownBurnResult =
        unknownBurnEngine
            .calculateSync({

                simulations:
                    50,

                random:
                    createSeededRandom(
                        99
                    )

            });

    assert(
        unknownBurnResult
            .observableRemaining === 12,
        "未知燒牌牌靴的可觀察牌數錯誤"
    );

    assert(
        unknownBurnResult
            .physicalRemaining === 10,
        "未知燒牌牌靴的物理牌數錯誤"
    );

    assert(
        unknownBurnResult
            .remainingCards === 10,
        "remainingCards 應顯示物理牌數"
    );

    assert(
        unknownBurnResult
            .unknownBurnedCount === 2,
        "未知燒牌張數錯誤"
    );

    messages.push(
        "✓ 未知燒牌與物理剩餘數處理正確"
    );


    /**
     * 10. 非同步計算與進度。
     */
    let progressCalls = 0;

    let lastProgress = null;

    const beforeAsync =
        snapshotShoe(shoe);

    const asyncResult =
        await engine.calculate({

            simulations:
                300,

            batchSize:
                25,

            random:
                createSeededRandom(
                    syncSeed
                ),

            onProgress(progress) {

                progressCalls++;

                lastProgress =
                    progress;

            }

        });

    const afterAsync =
        snapshotShoe(shoe);

    assert(
        beforeAsync === afterAsync,
        "calculate() 不應修改原始 Shoe"
    );

    assert(
        progressCalls > 0,
        "onProgress 應至少被呼叫一次"
    );

    assert(
        lastProgress !== null,
        "缺少最後進度資料"
    );

    assert(
        lastProgress.completed === 300,
        "最後 completed 應等於模擬次數"
    );

    assert(
        lastProgress.total === 300,
        "最後 total 應等於模擬次數"
    );

    assert(
        approximatelyEqual(
            lastProgress.ratio,
            1
        ),
        "最後 ratio 應為 1"
    );

    assert(
        approximatelyEqual(
            lastProgress.percent,
            100
        ),
        "最後 percent 應為 100"
    );

    messages.push(
        "✓ calculate()、onProgress 與 Shoe 保護正確"
    );


    /**
     * 11. 同步與非同步使用同一 seed 時應完全一致。
     */
    assertCountersEqual(
        syncResult.counts,
        asyncResult.counts
    );

    for (
        const name of
        expectedEvents
    ) {

        assert(
            syncResult.probability[name] ===
                asyncResult.probability[name],
            `同步與非同步的 ${name} 機率不一致`
        );

    }

    messages.push(
        "✓ 可重現亂數使同步與非同步結果一致"
    );


    /**
     * 12. 相同 seed 應產生相同結果。
     */
    const repeatA =
        engine.calculateSync({

            simulations:
                120,

            random:
                createSeededRandom(
                    777
                )

        });

    const repeatB =
        engine.calculateSync({

            simulations:
                120,

            random:
                createSeededRandom(
                    777
                )

        });

    assertCountersEqual(
        repeatA.counts,
        repeatB.counts
    );

    messages.push(
        "✓ 自訂 Seed Random 可重現結果"
    );


    /**
     * 13. AbortSignal。
     */
    const controller =
        new AbortController();

    controller.abort();

    let abortError =
        null;

    try {

        await engine.calculate({

            simulations:
                100,

            batchSize:
                10,

            signal:
                controller.signal,

            random:
                createSeededRandom(
                    1
                )

        });

    }
    catch (error) {

        abortError =
            error;

    }

    assert(
        abortError instanceof Error,
        "中止模擬時應拋出錯誤"
    );

    assert(
        abortError.name ===
            "AbortError",
        "中止錯誤名稱應為 AbortError"
    );

    messages.push(
        "✓ AbortSignal 可中止 Monte Carlo"
    );


    /**
     * 14. 非法 random 回傳值。
     */
    let invalidRandomError =
        null;

    try {

        engine.calculateSync({

            simulations:
                1,

            random() {

                return 1;

            }

        });

    }
    catch (error) {

        invalidRandomError =
            error;

    }

    assert(
        invalidRandomError instanceof Error,
        "非法 random() 回傳值應拋出錯誤"
    );

    messages.push(
        "✓ random() 輸出範圍驗證正確"
    );


    /**
     * 15. clone()。
     */
    const cloned =
        engine.clone();

    assert(
        cloned instanceof MonteCarlo,
        "clone() 應回傳 MonteCarlo"
    );

    assert(
        cloned !== engine,
        "clone() 不應回傳原實例"
    );

    assert(
        cloned.shoe === shoe,
        "clone() 應保留相同 Shoe context"
    );

    assert(
        cloned.options.simulations ===
            engine.options.simulations,
        "clone() 應保留 simulations"
    );

    assert(
        cloned.options.batchSize ===
            engine.options.batchSize,
        "clone() 應保留 batchSize"
    );

    messages.push(
        "✓ clone() 正確"
    );


    /**
     * 16. setOptions()。
     */
    engine.setOptions({

        simulations:
            200,

        batchSize:
            20

    });

    assert(
        engine.options.simulations === 200,
        "setOptions() 沒有更新 simulations"
    );

    assert(
        engine.options.batchSize === 20,
        "setOptions() 沒有更新 batchSize"
    );

    let invalidOptionsError =
        null;

    try {

        engine.setOptions({
            simulations: 0
        });

    }
    catch (error) {

        invalidOptionsError =
            error;

    }

    assert(
        invalidOptionsError instanceof Error,
        "非法 simulations 應拋出錯誤"
    );

    /**
     * setOptions() 先賦值再驗證，
     * 測試結束前恢復合法設定。
     */
    engine.setOptions({

        simulations:
            200,

        batchSize:
            20

    });

    messages.push(
        "✓ setOptions() 與非法設定驗證正確"
    );


    /**
     * 17. summary 與 toJSON()。
     */
    const summary =
        engine.summary;

    const json =
        engine.toJSON();

    assert(
        summary.hasShoe === true,
        "summary.hasShoe 應為 true"
    );

    assert(
        summary.observableRemaining ===
            shoe.observableRemaining,
        "summary.observableRemaining 錯誤"
    );

    assert(
        summary.physicalRemaining ===
            shoe.physicalRemaining,
        "summary.physicalRemaining 錯誤"
    );

    assert(
        summary.unknownBurnedCount ===
            shoe.unknownBurnedCount,
        "summary.unknownBurnedCount 錯誤"
    );

    assert(
        json.simulations ===
            engine.options.simulations,
        "toJSON() simulations 錯誤"
    );

    assert(
        json.batchSize ===
            engine.options.batchSize,
        "toJSON() batchSize 錯誤"
    );

    messages.push(
        "✓ summary 與 toJSON() 正確"
    );


    return `
${messages.join("\n")}

Monte Carlo v2 測試完成

模擬次數：${syncResult.simulations}

Player：${syncResult.probability.player}
Banker：${syncResult.probability.banker}
Tie：${syncResult.probability.tie}

主結果總和：${mainTotal}

Player Pair：${syncResult.probability.playerPair}
Banker Pair：${syncResult.probability.bankerPair}
Super 6：${syncResult.probability.super6}

可觀察牌數：${syncResult.observableRemaining}
物理剩餘牌數：${syncResult.physicalRemaining}
未知燒牌數：${syncResult.unknownBurnedCount}

執行時間：${syncResult.durationMs} ms
`;
}
