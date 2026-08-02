/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Shoe Test
 *
 * 測試範圍：
 *
 * 1. constructor()
 * 2. deckCount / total
 * 3. create()
 * 4. 標準牌組完整性
 * 5. remaining / observableRemaining
 * 6. physicalRemaining
 * 7. unknownBurnedCount
 * 8. draw()
 * 9. remove()
 * 10. restore()
 * 11. resolveCard()
 * 12. peek()
 * 13. history / used
 * 14. registerUnknownBurn()
 * 15. shuffle()
 * 16. reset()
 * 17. clone()
 * 18. toJSON()
 * 19. fromJSON()
 * 20. summary
 */

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
 * 預期拋出錯誤
 */
function assertThrows(
    callback,
    message
) {

    let error =
        null;

    try {

        callback();

    }
    catch (caught) {

        error =
            caught;

    }

    assert(
        error instanceof Error,
        message
    );

    return error;

}


/**
 * 建立指定牌
 */
function createCard(
    rank,
    suit,
    deck = 1
) {

    return new Card(
        rank,
        suit,
        deck
    );

}


/**
 * 取得牌的 Deck 編號
 */
function getDeckNumber(card) {

    return (
        card.deck ??
        card.deckNumber
    );

}


/**
 * 檢查兩張牌相同
 */
function sameCard(
    left,
    right
) {

    if (
        left &&
        typeof left.equals ===
            "function"
    ) {

        return left.equals(
            right
        );

    }

    return (

        left?.rank === right?.rank &&

        left?.suit === right?.suit &&

        getDeckNumber(left) ===
            getDeckNumber(right)

    );

}


/**
 * Shoe 完整測試
 */
export default function shoeTest() {

    const messages = [];


    /**
     * 1. constructor()。
     */
    const shoe =
        new Shoe(8);

    assert(
        shoe instanceof Shoe,
        "Shoe 建立失敗"
    );

    assert(
        shoe.deckCount === 8,
        "deckCount 應為 8"
    );

    assert(
        shoe.total === 416,
        "8 副牌總數應為 416"
    );

    messages.push(
        "✓ constructor()、deckCount、total 正確"
    );


    /**
     * 2. 初始牌數。
     */
    assert(
        Array.isArray(
            shoe.cards
        ),
        "shoe.cards 應為陣列"
    );

    assert(
        shoe.cards.length === 416,
        "新 Shoe 應包含 416 張牌"
    );

    assert(
        shoe.remaining === 416,
        "remaining 應為 416"
    );

    assert(
        shoe.observableRemaining === 416,
        "observableRemaining 應為 416"
    );

    assert(
        shoe.physicalRemaining === 416,
        "physicalRemaining 應為 416"
    );

    assert(
        shoe.unknownBurnedCount === 0,
        "unknownBurnedCount 初始應為 0"
    );

    messages.push(
        "✓ 新牌靴初始剩餘牌數正確"
    );


    /**
     * 3. 標準牌組完整性。
     */
    const ids =
        new Set(
            shoe.cards.map(
                card =>
                    card.id
            )
        );

    assert(
        ids.size === 416,
        "8 副牌的實體 Card ID 應全部唯一"
    );

    const ranks = [

        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K"

    ];

    const suits = [

        "S",
        "H",
        "D",
        "C"

    ];

    for (
        let deck = 1;
        deck <= 8;
        deck++
    ) {

        for (
            const suit of
            suits
        ) {

            for (
                const rank of
                ranks
            ) {

                const expected =
                    createCard(
                        rank,
                        suit,
                        deck
                    );

                const exists =
                    shoe.cards.some(
                        card =>
                            sameCard(
                                card,
                                expected
                            )
                    );

                assert(
                    exists,
                    `缺少牌：${deck}-${suit}-${rank}`
                );

            }

        }

    }

    messages.push(
        "✓ 8 副標準牌組完整且無重複實體牌"
    );


    /**
     * 4. 非法 deckCount。
     */
    assertThrows(
        () =>
            new Shoe(0),
        "deckCount 0 應拋出錯誤"
    );

    assertThrows(
        () =>
            new Shoe(1.5),
        "非整數 deckCount 應拋出錯誤"
    );

    messages.push(
        "✓ 非法 deckCount 驗證正確"
    );


    /**
     * 5. peek() 必須回傳副本。
     */
    const peeked =
        shoe.peek();

    assert(
        Array.isArray(peeked),
        "peek() 應回傳陣列"
    );

    assert(
        peeked !== shoe.cards,
        "peek() 不應回傳原 cards 陣列"
    );

    assert(
        peeked.length ===
            shoe.cards.length,
        "peek() 牌數錯誤"
    );

    peeked.pop();

    assert(
        shoe.cards.length === 416,
        "修改 peek() 結果不應影響 Shoe"
    );

    messages.push(
        "✓ peek() 回傳安全副本"
    );


    /**
     * 6. draw()。
     */
    const drawShoe =
        new Shoe(1);

    const beforeDraw =
        drawShoe.remaining;

    const expectedTop =
        drawShoe.cards[
            drawShoe.cards.length - 1
        ];

    const drawn =
        drawShoe.draw();

    assert(
        drawn instanceof Card,
        "draw() 應回傳 Card"
    );

    assert(
        sameCard(
            drawn,
            expectedTop
        ),
        "draw() 應從 cards 尾端抽牌"
    );

    assert(
        drawShoe.remaining ===
            beforeDraw - 1,
        "draw() 應扣除一張牌"
    );

    assert(
        drawShoe.discarded.some(
            card =>
                sameCard(
                    card,
                    drawn
                )
        ),
        "draw() 應將牌加入 discarded"
    );

    assert(
        drawShoe.used === 1,
        "draw() 後 used 應為 1"
    );

    assert(
        drawShoe.history.length === 1,
        "draw() 後 history 應有一張"
    );

    messages.push(
        "✓ draw()、used、history 正確"
    );


    /**
     * 7. remove()。
     */
    const removeShoe =
        new Shoe(2);

    const target =
        createCard(
            "7",
            "H",
            2
        );

    const beforeRemove =
        removeShoe.remaining;

    const removed =
        removeShoe.remove(
            target
        );

    assert(
        removeShoe.remaining ===
            beforeRemove - 1,
        "remove() 應扣除一張牌"
    );

    assert(
        !removeShoe.cards.some(
            card =>
                sameCard(
                    card,
                    target
                )
        ),
        "remove() 後目標牌不應留在 cards"
    );

    assert(
        removeShoe.discarded.some(
            card =>
                sameCard(
                    card,
                    target
                )
        ),
        "remove() 應將牌加入 discarded"
    );

    if (removed instanceof Card) {

        assert(
            sameCard(
                removed,
                target
            ),
            "remove() 回傳的牌錯誤"
        );

    }

    assertThrows(
        () =>
            removeShoe.remove(
                target
            ),
        "重複移除不存在的牌應拋出錯誤"
    );

    messages.push(
        "✓ remove() 與不存在牌驗證正確"
    );


    /**
     * 8. restore()。
     */
    const beforeRestore =
        removeShoe.remaining;

    const restored =
        removeShoe.restore(
            removed ??
            target
        );

    assert(
        removeShoe.remaining ===
            beforeRestore + 1,
        "restore() 應把牌放回 Shoe"
    );

    assert(
        removeShoe.cards.some(
            card =>
                sameCard(
                    card,
                    target
                )
        ),
        "restore() 後牌應回到 cards"
    );

    assert(
        !removeShoe.discarded.some(
            card =>
                sameCard(
                    card,
                    target
                )
        ),
        "restore() 後牌應從 discarded 移除"
    );

    if (restored instanceof Card) {

        assert(
            sameCard(
                restored,
                target
            ),
            "restore() 回傳牌錯誤"
        );

    }

    messages.push(
        "✓ restore() 正確"
    );


    /**
     * 9. resolveCard()。
     */
    const resolveShoe =
        new Shoe(2);

    const resolvedByObject =
        resolveShoe.resolveCard({

            rank:
                "Q",

            suit:
                "D",

            deck:
                2

        });

    assert(
        resolvedByObject instanceof Card,
        "resolveCard() 應回傳 Card"
    );

    assert(
        resolvedByObject.rank === "Q" &&
        resolvedByObject.suit === "D" &&
        getDeckNumber(
            resolvedByObject
        ) === 2,
        "resolveCard() 精確牌面解析錯誤"
    );

    const resolvedWithoutDeck =
        resolveShoe.resolveCard({

            rank:
                "Q",

            suit:
                "D"

        });

    assert(
        resolvedWithoutDeck instanceof Card,
        "未指定 deck 時仍應解析到可用 Card"
    );

    assert(
        resolvedWithoutDeck.rank ===
            "Q" &&
        resolvedWithoutDeck.suit ===
            "D",
        "未指定 deck 的牌面解析錯誤"
    );

    assertThrows(
        () =>
            resolveShoe.resolveCard({
                rank:
                    "Q",
                suit:
                    "X"
            }),
        "非法 Suit 應被 resolveCard() 拒絕"
    );

    messages.push(
        "✓ resolveCard() 正確"
    );


    /**
     * 10. registerUnknownBurn()。
     */
    const burnShoe =
        new Shoe(1);

    const beforeBurnObservable =
        burnShoe.observableRemaining;

    const beforeBurnPhysical =
        burnShoe.physicalRemaining;

    burnShoe.registerUnknownBurn(
        7
    );

    assert(
        burnShoe.unknownBurnedCount === 7,
        "unknownBurnedCount 應為 7"
    );

    assert(
        burnShoe.observableRemaining ===
            beforeBurnObservable,
        "未知燒牌不應從可觀察牌池任意移除"
    );

    assert(
        burnShoe.physicalRemaining ===
            beforeBurnPhysical - 7,
        "未知燒牌應扣除 physicalRemaining"
    );

    burnShoe.registerUnknownBurn(
        3
    );

    assert(
        burnShoe.unknownBurnedCount === 10,
        "未知燒牌應可累加"
    );

    assert(
        burnShoe.physicalRemaining === 42,
        "累加 10 張未知燒牌後物理剩餘應為 42"
    );

    assertThrows(
        () =>
            burnShoe.registerUnknownBurn(
                -1
            ),
        "負數未知燒牌應拋出錯誤"
    );

    assertThrows(
        () =>
            burnShoe.registerUnknownBurn(
                1.5
            ),
        "非整數未知燒牌應拋出錯誤"
    );

    messages.push(
        "✓ registerUnknownBurn() 與雙剩餘牌模型正確"
    );


    /**
     * 11. unknown burn 不可超過可用物理牌。
     */
    assertThrows(
        () =>
            burnShoe.registerUnknownBurn(
                100
            ),
        "未知燒牌不可超過物理剩餘牌數"
    );

    messages.push(
        "✓ 未知燒牌上限驗證正確"
    );


    /**
     * 12. shuffle()。
     *
     * 只驗證：
     * - 回傳 Shoe 或可鏈式使用
     * - 牌數不變
     * - Card ID 集合不變
     */
    const shuffleShoe =
        new Shoe(1);

    const beforeShuffleIds =
        [
            ...shuffleShoe.cards
                .map(card => card.id)
        ].sort();

    const shuffleResult =
        shuffleShoe.shuffle();

    const afterShuffleIds =
        [
            ...shuffleShoe.cards
                .map(card => card.id)
        ].sort();

    assert(
        shuffleShoe.remaining === 52,
        "shuffle() 不應改變牌數"
    );

    assert(
        JSON.stringify(
            beforeShuffleIds
        ) ===
        JSON.stringify(
            afterShuffleIds
        ),
        "shuffle() 不應新增或遺失牌"
    );

    if (
        shuffleResult !== undefined
    ) {

        assert(
            shuffleResult ===
                shuffleShoe,
            "shuffle() 若有回傳值應支援鏈式操作"
        );

    }

    messages.push(
        "✓ shuffle() 保持牌組完整"
    );


    /**
     * 13. clone()。
     */
    const cloneSource =
        new Shoe(2);

    cloneSource.remove(
        createCard(
            "A",
            "S",
            1
        )
    );

    cloneSource.registerUnknownBurn(
        4
    );

    const cloned =
        cloneSource.clone();

    assert(
        cloned instanceof Shoe,
        "clone() 應回傳 Shoe"
    );

    assert(
        cloned !== cloneSource,
        "clone() 不應回傳原實例"
    );

    assert(
        cloned.cards !==
            cloneSource.cards,
        "clone() cards 不應共用陣列"
    );

    assert(
        cloned.deckCount ===
            cloneSource.deckCount,
        "clone() deckCount 錯誤"
    );

    assert(
        cloned.observableRemaining ===
            cloneSource.observableRemaining,
        "clone() observableRemaining 錯誤"
    );

    assert(
        cloned.physicalRemaining ===
            cloneSource.physicalRemaining,
        "clone() physicalRemaining 錯誤"
    );

    assert(
        cloned.unknownBurnedCount ===
            cloneSource.unknownBurnedCount,
        "clone() unknownBurnedCount 錯誤"
    );

    cloned.cards.pop();

    assert(
        cloned.cards.length !==
            cloneSource.cards.length,
        "修改 clone 不應影響原 Shoe"
    );

    messages.push(
        "✓ clone() 為獨立深層副本"
    );


    /**
     * 14. toJSON() / fromJSON()。
     */
    const jsonSource =
        new Shoe(2);

    const jsonRemoved =
        jsonSource.remove(
            createCard(
                "K",
                "C",
                2
            )
        );

    jsonSource.registerUnknownBurn(
        5
    );

    const json =
        jsonSource.toJSON();

    assert(
        json &&
        typeof json ===
            "object",
        "toJSON() 應回傳物件"
    );

    assert(
        json.deckCount === 2,
        "JSON deckCount 錯誤"
    );

    assert(
        Array.isArray(
            json.cards
        ),
        "JSON cards 應為陣列"
    );

    assert(
        Array.isArray(
            json.discarded
        ),
        "JSON discarded 應為陣列"
    );

    assert(
        json.unknownBurnedCount === 5,
        "JSON unknownBurnedCount 錯誤"
    );

    const jsonRestored =
        Shoe.fromJSON(
            json
        );

    assert(
        jsonRestored instanceof Shoe,
        "fromJSON() 應回傳 Shoe"
    );

    assert(
        jsonRestored.deckCount === 2,
        "還原後 deckCount 錯誤"
    );

    assert(
        jsonRestored.observableRemaining ===
            jsonSource.observableRemaining,
        "還原後 observableRemaining 錯誤"
    );

    assert(
        jsonRestored.physicalRemaining ===
            jsonSource.physicalRemaining,
        "還原後 physicalRemaining 錯誤"
    );

    assert(
        jsonRestored.unknownBurnedCount ===
            jsonSource.unknownBurnedCount,
        "還原後 unknownBurnedCount 錯誤"
    );

    assert(
        jsonRestored.discarded.some(
            card =>
                sameCard(
                    card,
                    jsonRemoved ??
                    createCard(
                        "K",
                        "C",
                        2
                    )
                )
        ),
        "還原後 discarded 缺少已移除牌"
    );

    assertThrows(
        () =>
            Shoe.fromJSON(
                null
            ),
        "fromJSON(null) 應拋出錯誤"
    );

    messages.push(
        "✓ toJSON() / fromJSON() 正確"
    );


    /**
     * 15. summary。
     */
    const summary =
        jsonRestored.summary;

    assert(
        summary &&
        typeof summary ===
            "object",
        "summary 應為物件"
    );

    assert(
        summary.deckCount === 2,
        "summary.deckCount 錯誤"
    );

    assert(
        summary.total === 104,
        "summary.total 錯誤"
    );

    assert(
        summary.observableRemaining ===
            jsonRestored.observableRemaining,
        "summary.observableRemaining 錯誤"
    );

    assert(
        summary.physicalRemaining ===
            jsonRestored.physicalRemaining,
        "summary.physicalRemaining 錯誤"
    );

    assert(
        summary.unknownBurnedCount === 5,
        "summary.unknownBurnedCount 錯誤"
    );

    messages.push(
        "✓ summary 正確"
    );


    /**
     * 16. reset()。
     */
    const resetShoe =
        new Shoe(1);

    resetShoe.draw();

    resetShoe.registerUnknownBurn(
        3
    );

    resetShoe.reset();

    assert(
        resetShoe.remaining === 52,
        "reset() 後 remaining 應為 52"
    );

    assert(
        resetShoe.observableRemaining === 52,
        "reset() 後 observableRemaining 應為 52"
    );

    assert(
        resetShoe.physicalRemaining === 52,
        "reset() 後 physicalRemaining 應為 52"
    );

    assert(
        resetShoe.unknownBurnedCount === 0,
        "reset() 應清除 unknownBurnedCount"
    );

    assert(
        resetShoe.discarded.length === 0,
        "reset() 應清空 discarded"
    );

    messages.push(
        "✓ reset() 正確"
    );


    /**
     * 17. create() 不應重複堆疊。
     *
     * 若新版 create() 是公開方法，
     * 呼叫前先清空 cards，再重建標準牌組。
     */
    if (
        typeof resetShoe.create ===
            "function"
    ) {

        resetShoe.cards = [];

        resetShoe.create();

        assert(
            resetShoe.cards.length === 52,
            "create() 應建立一副 52 張牌"
        );

        messages.push(
            "✓ create() 正確"
        );

    }


    return `
${messages.join("\n")}

Shoe 測試完成

8 副牌：
總牌數：${shoe.total}
可觀察牌數：${shoe.observableRemaining}
物理剩餘牌數：${shoe.physicalRemaining}

未知燒牌範例：
可觀察牌數：${burnShoe.observableRemaining}
物理剩餘牌數：${burnShoe.physicalRemaining}
未知燒牌數：${burnShoe.unknownBurnedCount}

JSON 還原：
副牌數：${jsonRestored.deckCount}
可觀察牌數：${jsonRestored.observableRemaining}
物理剩餘牌數：${jsonRestored.physicalRemaining}
已知移除牌數：${jsonRestored.used}
`;
}
