/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Burn Test
 *
 * 測試範圍：
 *
 * 1. constructor()
 * 2. 手動輸入燒牌指示牌
 * 3. A～9 燒牌數
 * 4. 10 / J / Q / K 燒牌數
 * 5. 公開指示牌移除
 * 6. 未知燒牌登記
 * 7. observableRemaining
 * 8. physicalRemaining
 * 9. 重複確認防護
 * 10. 非法輸入
 * 11. info getter
 * 12. toJSON()
 * 13. fromJSON()
 *
 * 正式流程：
 *
 * 使用者手動輸入燒牌指示牌
 * → Shoe 移除公開指示牌
 * → Burn 計算隱藏燒牌張數
 * → Shoe 只登記未知燒牌數量
 *
 * 隱藏燒牌不會虛構具體牌面。
 */

import Burn
    from "../engine/burn.js";

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
 * 建立測試 Shoe
 */
function createShoe() {

    const shoe =
        new Shoe(1);

    /**
     * 關閉隨機性。
     *
     * Shoe 建立後維持標準 52 張牌。
     */
    shoe.discarded = [];

    shoe.burned = [];

    shoe.unknownBurnedCount = 0;

    return shoe;

}


/**
 * 建立指定指示牌
 */
function createIndicator(
    rank,
    suit = "S",
    deck = 1
) {

    return new Card(
        rank,
        suit,
        deck
    );

}


/**
 * 取得 Burn 計算值
 */
function expectedHiddenCount(rank) {

    if (rank === "A") {

        return 1;

    }

    if (
        rank === "10" ||
        rank === "J" ||
        rank === "Q" ||
        rank === "K"
    ) {

        return 10;

    }

    return Number(rank);

}


/**
 * 確認牌已不在可觀察牌池
 */
function assertCardRemoved(
    shoe,
    card,
    message
) {

    const stillExists =
        shoe.cards.some(
            item =>
                item.equals(card)
        );

    assert(
        stillExists === false,
        message
    );

}


/**
 * 執行單張指示牌測試
 */
function runIndicatorCase(
    rank,
    suit = "S"
) {

    const shoe =
        createShoe();

    const burn =
        new Burn(
            shoe
        );

    const indicator =
        createIndicator(
            rank,
            suit
        );

    const beforeObservable =
        shoe.observableRemaining;

    const beforePhysical =
        shoe.physicalRemaining;

    const hiddenCount =
        expectedHiddenCount(
            rank
        );

    const info =
        burn.confirmIndicator(
            indicator
        );

    assert(
        burn.isConfirmed === true,
        `${rank} 指示牌確認後 isConfirmed 應為 true`
    );

    assert(
        burn.indicator instanceof Card,
        `${rank} 指示牌應保存為 Card`
    );

    assert(
        burn.indicator.equals(
            indicator
        ),
        `${rank} 指示牌保存錯誤`
    );

    assert(
        burn.hiddenCount ===
            hiddenCount,
        `${rank} 隱藏燒牌數錯誤`
    );

    assert(
        burn.totalRemoved ===
            hiddenCount + 1,
        `${rank} 總移除張數錯誤`
    );

    assert(
        shoe.observableRemaining ===
            beforeObservable - 1,
        `${rank} 只應從可觀察牌池移除公開指示牌`
    );

    assert(
        shoe.physicalRemaining ===
            beforePhysical -
            hiddenCount -
            1,
        `${rank} 物理剩餘牌數錯誤`
    );

    assert(
        shoe.unknownBurnedCount ===
            hiddenCount,
        `${rank} Shoe 未知燒牌數錯誤`
    );

    assertCardRemoved(
        shoe,
        indicator,
        `${rank} 公開指示牌應從 Shoe 移除`
    );

    assert(
        info.hiddenCount ===
            hiddenCount,
        `${rank} info.hiddenCount 錯誤`
    );

    assert(
        info.totalRemoved ===
            hiddenCount + 1,
        `${rank} info.totalRemoved 錯誤`
    );

    return {

        shoe,

        burn,

        indicator,

        info

    };

}


/**
 * Burn 完整測試
 */
export default function burnTest() {

    const messages = [];


    /**
     * 1. constructor() 必須有 Shoe。
     */
    let missingShoeError =
        null;

    try {

        new Burn();

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
        "✓ constructor() 會驗證 Shoe"
    );


    /**
     * 2. 初始狀態。
     */
    const initialShoe =
        createShoe();

    const burn =
        new Burn(
            initialShoe
        );

    assert(
        burn.isConfirmed === false,
        "初始 Burn 不應確認"
    );

    assert(
        burn.indicator === null,
        "初始 indicator 應為 null"
    );

    assert(
        burn.hiddenCount === 0,
        "初始 hiddenCount 應為 0"
    );

    assert(
        burn.totalRemoved === 0,
        "初始 totalRemoved 應為 0"
    );

    messages.push(
        "✓ Burn 初始狀態正確"
    );


    /**
     * 3. execute() 不再允許自動抽指示牌。
     */
    if (
        typeof burn.execute ===
            "function"
    ) {

        let executeError =
            null;

        try {

            burn.execute();

        }
        catch (error) {

            executeError =
                error;

        }

        assert(
            executeError instanceof Error,
            "execute() 未輸入指示牌時應報錯"
        );

        messages.push(
            "✓ execute() 禁止自動取得指示牌"
        );

    }


    /**
     * 4. A～9 指示牌。
     */
    const numericRanks = [

        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9"

    ];

    for (
        const rank of
        numericRanks
    ) {

        runIndicatorCase(
            rank
        );

    }

    messages.push(
        "✓ A～9 指示牌燒牌數正確"
    );


    /**
     * 5. 10 / J / Q / K 都為 10。
     */
    const tenRanks = [

        "10",
        "J",
        "Q",
        "K"

    ];

    for (
        const rank of
        tenRanks
    ) {

        const result =
            runIndicatorCase(
                rank,
                "H"
            );

        assert(
            result.burn.hiddenCount === 10,
            `${rank} 應燒 10 張隱藏牌`
        );

    }

    messages.push(
        "✓ 10、J、Q、K 均登記 10 張未知燒牌"
    );


    /**
     * 6. 使用普通物件輸入。
     */
    const objectShoe =
        createShoe();

    const objectBurn =
        new Burn(
            objectShoe
        );

    const objectInfo =
        objectBurn
            .confirmIndicator({

                rank:
                    "6",

                suit:
                    "D",

                deck:
                    1

            });

    assert(
        objectBurn.indicator
            instanceof Card,
        "普通物件輸入應解析成 Card"
    );

    assert(
        objectBurn.indicator.rank ===
            "6",
        "普通物件 Rank 解析錯誤"
    );

    assert(
        objectBurn.indicator.suit ===
            "D",
        "普通物件 Suit 解析錯誤"
    );

    assert(
        objectInfo.hiddenCount === 6,
        "普通物件輸入燒牌數錯誤"
    );

    messages.push(
        "✓ 普通物件指示牌輸入正確"
    );


    /**
     * 7. 重複確認防護。
     */
    let repeatedError =
        null;

    try {

        objectBurn
            .confirmIndicator({

                rank:
                    "7",

                suit:
                    "C",

                deck:
                    1

            });

    }
    catch (error) {

        repeatedError =
            error;

    }

    assert(
        repeatedError instanceof Error,
        "重複確認指示牌應報錯"
    );

    assert(
        objectBurn.indicator.rank ===
            "6",
        "重複確認不應改變原指示牌"
    );

    assert(
        objectBurn.hiddenCount === 6,
        "重複確認不應改變 hiddenCount"
    );

    messages.push(
        "✓ 重複確認指示牌防護正確"
    );


    /**
     * 8. 非法輸入。
     */
    const invalidInputs = [

        null,

        {},

        {
            rank:
                "0",

            suit:
                "S",

            deck:
                1
        },

        {
            rank:
                "A",

            suit:
                "X",

            deck:
                1
        }

    ];

    for (
        const input of
        invalidInputs
    ) {

        const invalidShoe =
            createShoe();

        const invalidBurn =
            new Burn(
                invalidShoe
            );

        let invalidError =
            null;

        try {

            invalidBurn
                .confirmIndicator(
                    input
                );

        }
        catch (error) {

            invalidError =
                error;

        }

        assert(
            invalidError instanceof Error,
            `非法輸入 ${JSON.stringify(input)} 應報錯`
        );

        assert(
            invalidBurn.isConfirmed ===
                false,
            "非法輸入後不應確認 Burn"
        );

        assert(
            invalidShoe
                .observableRemaining === 52,
            "非法輸入不應改變 Shoe"
        );

    }

    messages.push(
        "✓ 非法指示牌輸入驗證正確"
    );


    /**
     * 9. Shoe 中不存在的牌。
     */
    const missingCardShoe =
        createShoe();

    const missingCard =
        createIndicator(
            "A",
            "S"
        );

    missingCardShoe.remove(
        missingCard
    );

    const missingCardBurn =
        new Burn(
            missingCardShoe
        );

    let missingCardError =
        null;

    try {

        missingCardBurn
            .confirmIndicator(
                missingCard
            );

    }
    catch (error) {

        missingCardError =
            error;

    }

    assert(
        missingCardError instanceof Error,
        "Shoe 中不存在的指示牌應報錯"
    );

    assert(
        missingCardBurn.isConfirmed ===
            false,
        "不存在的牌不應完成 Burn"
    );

    messages.push(
        "✓ Shoe 中不存在的指示牌會被拒絕"
    );


    /**
     * 10. info getter。
     */
    const infoCase =
        runIndicatorCase(
            "4",
            "C"
        );

    const info =
        infoCase.burn.info;

    assert(
        info &&
        typeof info ===
            "object",
        "info 應為物件"
    );

    assert(
        info.confirmed === true,
        "info.confirmed 應為 true"
    );

    assert(
        info.indicator.rank ===
            "4",
        "info.indicator 錯誤"
    );

    assert(
        info.hiddenCount === 4,
        "info.hiddenCount 錯誤"
    );

    assert(
        info.totalRemoved === 5,
        "info.totalRemoved 錯誤"
    );

    messages.push(
        "✓ info getter 正確"
    );


    /**
     * 11. toJSON()。
     */
    const json =
        infoCase.burn.toJSON();

    assert(
        json &&
        typeof json ===
            "object",
        "toJSON() 應回傳物件"
    );

    assert(
        json.confirmed === true,
        "JSON confirmed 錯誤"
    );

    assert(
        json.indicator.rank ===
            "4",
        "JSON indicator 錯誤"
    );

    assert(
        json.hiddenCount === 4,
        "JSON hiddenCount 錯誤"
    );

    assert(
        json.totalRemoved === 5,
        "JSON totalRemoved 錯誤"
    );

    messages.push(
        "✓ toJSON() 正確"
    );


    /**
     * 12. fromJSON()。
     *
     * Shoe 本身需先從相同狀態還原，
     * Burn.fromJSON() 只恢復 Burn 狀態，
     * 不應再次扣牌。
     */
    const restoredShoe =
        Shoe.fromJSON(
            infoCase.shoe
                .toJSON()
        );

    const beforeRestoreObservable =
        restoredShoe
            .observableRemaining;

    const beforeRestorePhysical =
        restoredShoe
            .physicalRemaining;

    const restored =
        Burn.fromJSON(
            json,
            restoredShoe
        );

    assert(
        restored instanceof Burn,
        "fromJSON() 應回傳 Burn"
    );

    assert(
        restored.isConfirmed ===
            true,
        "還原後 isConfirmed 應為 true"
    );

    assert(
        restored.indicator.rank ===
            "4",
        "還原後 indicator 錯誤"
    );

    assert(
        restored.hiddenCount === 4,
        "還原後 hiddenCount 錯誤"
    );

    assert(
        restored.totalRemoved === 5,
        "還原後 totalRemoved 錯誤"
    );

    assert(
        restoredShoe
            .observableRemaining ===
            beforeRestoreObservable,
        "fromJSON() 不應再次扣除可觀察牌"
    );

    assert(
        restoredShoe
            .physicalRemaining ===
            beforeRestorePhysical,
        "fromJSON() 不應再次扣除物理牌"
    );

    messages.push(
        "✓ fromJSON() 正確且不重複扣牌"
    );


    /**
     * 13. fromJSON() 驗證。
     */
    let missingDataError =
        null;

    try {

        Burn.fromJSON(
            null,
            restoredShoe
        );

    }
    catch (error) {

        missingDataError =
            error;

    }

    assert(
        missingDataError instanceof Error,
        "fromJSON() 缺少資料時應報錯"
    );

    let missingRestoreShoeError =
        null;

    try {

        Burn.fromJSON(
            json,
            null
        );

    }
    catch (error) {

        missingRestoreShoeError =
            error;

    }

    assert(
        missingRestoreShoeError
            instanceof Error,
        "fromJSON() 缺少 Shoe 時應報錯"
    );

    messages.push(
        "✓ fromJSON() 參數驗證正確"
    );


    return `
${messages.join("\n")}

Burn 測試完成

A 指示牌：
隱藏燒牌：1
總移除：2

6 指示牌：
隱藏燒牌：6
總移除：7

K 指示牌：
隱藏燒牌：10
總移除：11

JSON 範例：
指示牌：${json.indicator.rank}${json.indicator.suit}
隱藏燒牌：${json.hiddenCount}
總移除：${json.totalRemoved}

還原後：
可觀察牌數：${restoredShoe.observableRemaining}
物理剩餘牌數：${restoredShoe.physicalRemaining}
未知燒牌數：${restoredShoe.unknownBurnedCount}
`;
}
