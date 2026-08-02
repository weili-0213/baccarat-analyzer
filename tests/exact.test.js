/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Exact Engine Test
 *
 * 測試：
 *
 * 1. Exact 建立與設定
 * 2. Shoe 驗證
 * 3. 同步精確計算
 * 4. 非同步精確計算
 * 5. 主結果機率總和
 * 6. 側注事件機率範圍
 * 7. 浮點誤差與容許值
 * 8. 新版 Shoe 剩餘牌欄位
 * 9. onProgress
 * 10. AbortSignal
 * 11. 不修改原始 Shoe
 * 12. clone() 與 setOptions()
 */

import Exact
    from "../analysis/exact.js";

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
    tolerance = 1e-9
) {

    return (
        Math.abs(
            left - right
        ) <= tolerance
    );

}


/**
 * 建立小型可測試牌靴
 *
 * Exact 最多需要六張牌，因此使用六張已知牌。
 * 牌面刻意包含：
 *
 * - Pair 可能
 * - Natural 可能
 * - 0 點牌
 * - 不同點數
 */
function createTestShoe() {

    const shoe =
        new Shoe(1);

    shoe.cards = [

        new Card(
            "A",
            "S",
            1
        ),

        new Card(
            "A",
            "H",
            1
        ),

        new Card(
            "4",
            "D",
            1
        ),

        new Card(
            "6",
            "C",
            1
        ),

        new Card(
            "8",
            "S",
            1
        ),

        new Card(
            "K",
            "H",
            1
        )

    ];

    shoe.discarded = [];

    shoe.burned = [];

    shoe.unknownBurnedCount = 0;

    return shoe;

}


/**
 * 建立具有未知燒牌狀態的測試牌靴
 */
function createUnknownBurnShoe() {

    const shoe =
        new Shoe(1);

    shoe.cards = [

        new Card("A", "S", 1),
        new Card("2", "H", 1),
        new Card("3", "D", 1),
        new Card("4", "C", 1),
        new Card("5", "S", 1),
        new Card("6", "H", 1),
        new Card("7", "D", 1),
        new Card("8", "C", 1)

    ];

    shoe.discarded = [];

    shoe.burned = [];

    shoe.unknownBurnedCount = 2;

    return shoe;

}


/**
 * 取得牌靴快照
 */
function snapshotShoe(shoe) {

    return JSON.stringify(
        shoe.toJSON()
    );

}


/**
 * 檢查所有機率是否介於 0～1
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
 * Exact 完整測試
 */
export default async function exactTest() {

    const messages = [];


    /**
     * 1. 無 context 也可以先建立。
     */
    const emptyExact =
        new Exact();

    assert(
        emptyExact instanceof Exact,
        "Exact 建立失敗"
    );

    assert(
        emptyExact.shoe === null,
        "空 Exact 的 shoe 應為 null"
    );

    messages.push(
        "✓ Exact 可在沒有 Shoe 時建立"
    );


    /**
     * 2. 沒有 Shoe 時執行應報錯。
     */
    let missingShoeError =
        null;

    try {

        emptyExact.calculateSync();

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
        "✓ 沒有 Shoe 時會拒絕分析"
    );


    /**
     * 3. 建立正式 Exact。
     */
    const shoe =
        createTestShoe();

    const exact =
        new Exact(
            {
                shoe
            },
            {
                batchSize: 2,
                probabilityTolerance: 1e-9
            }
        );

    assert(
        exact.shoe === shoe,
        "Exact 沒有保存 Shoe"
    );

    assert(
        exact.options.batchSize === 2,
        "batchSize 設定失敗"
    );

    messages.push(
        "✓ Exact context 與 options 正確"
    );


    /**
     * 4. 同步計算不可修改原 Shoe。
     */
    const beforeSync =
        snapshotShoe(shoe);

    const syncResult =
        exact.calculateSync();

    const afterSync =
        snapshotShoe(shoe);

    assert(
        beforeSync === afterSync,
        "calculateSync() 不應修改原始 Shoe"
    );

    assert(
        syncResult.method === "exact",
        "同步結果 method 應為 exact"
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
            1,
            1e-9
        ),
        "Player + Banker + Tie 必須等於 1"
    );

    messages.push(
        "✓ Player、Banker、Tie 機率總和為 1"
    );


    /**
     * 6. 所有事件機率範圍。
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

    }

    messages.push(
        "✓ 所有主要與側注事件機率有效"
    );


    /**
     * 7. totalProbability 與誤差。
     */
    assert(
        Number.isFinite(
            syncResult.totalProbability
        ),
        "totalProbability 必須是有限數字"
    );

    assert(
        syncResult.totalProbability > 0,
        "totalProbability 必須大於 0"
    );

    assert(
        approximatelyEqual(
            syncResult.probabilityError,
            Math.abs(
                1 -
                syncResult.totalProbability
            ),
            1e-15
        ),
        "probabilityError 計算錯誤"
    );

    assert(
        syncResult.withinTolerance ===
        (
            syncResult.probabilityError <=
            exact.options.probabilityTolerance
        ),
        "withinTolerance 狀態錯誤"
    );

    assert(
        Number.isInteger(
            syncResult.terminalBranches
        ) &&
        syncResult.terminalBranches > 0,
        "terminalBranches 必須是正整數"
    );

    messages.push(
        "✓ 浮點誤差與 tolerance 狀態正確"
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

    const unknownBurnExact =
        new Exact({
            shoe:
                unknownBurnShoe
        });

    const unknownBurnResult =
        unknownBurnExact
            .calculateSync();

    assert(
        unknownBurnResult
            .observableRemaining === 8,
        "未知燒牌牌靴的可觀察牌數錯誤"
    );

    assert(
        unknownBurnResult
            .physicalRemaining === 6,
        "未知燒牌牌靴的物理牌數錯誤"
    );

    assert(
        unknownBurnResult
            .remainingCards === 6,
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
        await exact.calculate({

            batchSize:
                1,

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
        lastProgress.completed ===
            lastProgress.total,
        "最後進度應完成全部 prefixes"
    );

    assert(
        approximatelyEqual(
            lastProgress.ratio,
            1
        ),
        "最後進度 ratio 應為 1"
    );

    assert(
        approximatelyEqual(
            lastProgress.percent,
            100
        ),
        "最後進度 percent 應為 100"
    );

    messages.push(
        "✓ calculate()、onProgress 與 Shoe 保護正確"
    );


    /**
     * 11. 同步與非同步應得到相同結果。
     */
    for (
        const name of
        expectedEvents
    ) {

        assert(
            approximatelyEqual(

                syncResult
                    .probability[name],

                asyncResult
                    .probability[name],

                1e-12

            ),
            `同步與非同步的 ${name} 機率不一致`
        );

    }

    assert(
        approximatelyEqual(

            syncResult
                .totalProbability,

            asyncResult
                .totalProbability,

            1e-12

        ),
        "同步與非同步 totalProbability 不一致"
    );

    messages.push(
        "✓ 同步與非同步精確結果一致"
    );


    /**
     * 12. AbortSignal。
     */
    const controller =
        new AbortController();

    controller.abort();

    let abortError =
        null;

    try {

        await exact.calculate({

            batchSize:
                1,

            signal:
                controller.signal

        });

    }
    catch (error) {

        abortError =
            error;

    }

    assert(
        abortError instanceof Error,
        "中止分析時應拋出錯誤"
    );

    assert(
        abortError.name ===
            "AbortError",
        "中止錯誤名稱應為 AbortError"
    );

    messages.push(
        "✓ AbortSignal 可中止 Exact 分析"
    );


    /**
     * 13. clone()。
     */
    const cloned =
        exact.clone();

    assert(
        cloned instanceof Exact,
        "clone() 應回傳 Exact"
    );

    assert(
        cloned !== exact,
        "clone() 不應回傳原本實例"
    );

    assert(
        cloned.shoe === shoe,
        "clone() 應保留相同分析 Shoe"
    );

    assert(
        cloned.options.batchSize ===
            exact.options.batchSize,
        "clone() 應保留 options"
    );

    messages.push(
        "✓ clone() 正確"
    );


    /**
     * 14. setOptions()。
     */
    exact.setOptions({

        batchSize:
            3,

        probabilityTolerance:
            1e-8

    });

    assert(
        exact.options.batchSize === 3,
        "setOptions() 沒有更新 batchSize"
    );

    assert(
        exact.options
            .probabilityTolerance ===
            1e-8,
        "setOptions() 沒有更新 tolerance"
    );

    let invalidOptionError =
        null;

    try {

        exact.setOptions({
            batchSize: 0
        });

    }
    catch (error) {

        invalidOptionError =
            error;

    }

    assert(
        invalidOptionError instanceof Error,
        "非法 batchSize 應拋出錯誤"
    );

    messages.push(
        "✓ setOptions() 與非法設定驗證正確"
    );


    /**
     * 15. summary 與 toJSON()。
     */
    const summary =
        exact.summary;

    const json =
        exact.toJSON();

    assert(
        summary.hasShoe === true,
        "summary.hasShoe 應為 true"
    );

    assert(
        summary.observableRemaining ===
            shoe.observableRemaining,
        "summary observableRemaining 錯誤"
    );

    assert(
        summary.physicalRemaining ===
            shoe.physicalRemaining,
        "summary physicalRemaining 錯誤"
    );

    assert(
        json.batchSize ===
            exact.options.batchSize,
        "toJSON() batchSize 錯誤"
    );

    assert(
        json.probabilityTolerance ===
            exact.options
                .probabilityTolerance,
        "toJSON() probabilityTolerance 錯誤"
    );

    messages.push(
        "✓ summary 與 toJSON() 正確"
    );


    return `
${messages.join("\n")}

Exact 測試完成

Player：${syncResult.probability.player}
Banker：${syncResult.probability.banker}
Tie：${syncResult.probability.tie}

主結果總和：${mainTotal}
原始分支機率總和：${syncResult.totalProbability}
機率誤差：${syncResult.probabilityError}
終端分支數：${syncResult.terminalBranches}

可觀察牌數：${syncResult.observableRemaining}
物理剩餘牌數：${syncResult.physicalRemaining}
未知燒牌數：${syncResult.unknownBurnedCount}
`;
}
