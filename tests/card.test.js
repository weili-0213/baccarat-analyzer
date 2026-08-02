/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Card Test
 *
 * 測試範圍：
 *
 * 1. constructor()
 * 2. Rank / Suit / Deck 驗證
 * 3. baccaratValue
 * 4. pairValue
 * 5. isFaceCard
 * 6. isAce
 * 7. isRed / isBlack / color
 * 8. suitSymbol
 * 9. shortName
 * 10. id
 * 11. equals()
 * 12. toString()
 * 13. toJSON()
 * 14. fromJSON()
 * 15. clone()
 */

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
 * 預期某段程式拋出錯誤
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
 * Card 完整測試
 */
export default function cardTest() {

    const messages = [];


    /**
     * 1. 建立標準 Card。
     */
    const aceSpades =
        new Card(
            "A",
            "S",
            1
        );

    assert(
        aceSpades instanceof Card,
        "Card 建立失敗"
    );

    assert(
        aceSpades.rank === "A",
        "rank 應為 A"
    );

    assert(
        aceSpades.suit === "S",
        "suit 應為 S"
    );

    assert(
        (
            aceSpades.deck === 1 ||
            aceSpades.deckNumber === 1
        ),
        "deck 應為 1"
    );

    messages.push(
        "✓ constructor() 正確"
    );


    /**
     * 2. 所有合法 Rank。
     */
    const validRanks = [

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

    for (
        const rank of
        validRanks
    ) {

        const card =
            new Card(
                rank,
                "H",
                1
            );

        assert(
            card.rank === rank,
            `合法 Rank ${rank} 建立失敗`
        );

    }

    messages.push(
        "✓ 所有合法 Rank 可建立"
    );


    /**
     * 3. 所有合法 Suit。
     */
    const validSuits = [

        "S",
        "H",
        "D",
        "C"

    ];

    for (
        const suit of
        validSuits
    ) {

        const card =
            new Card(
                "7",
                suit,
                1
            );

        assert(
            card.suit === suit,
            `合法 Suit ${suit} 建立失敗`
        );

    }

    messages.push(
        "✓ 所有合法 Suit 可建立"
    );


    /**
     * 4. 非法 Rank / Suit / Deck。
     */
    assertThrows(
        () =>
            new Card(
                "1",
                "S",
                1
            ),
        "非法 Rank 應拋出錯誤"
    );

    assertThrows(
        () =>
            new Card(
                "A",
                "X",
                1
            ),
        "非法 Suit 應拋出錯誤"
    );

    assertThrows(
        () =>
            new Card(
                "A",
                "S",
                0
            ),
        "deck 0 應拋出錯誤"
    );

    assertThrows(
        () =>
            new Card(
                "A",
                "S",
                1.5
            ),
        "非整數 deck 應拋出錯誤"
    );

    messages.push(
        "✓ 非法 Rank、Suit、Deck 驗證正確"
    );


    /**
     * 5. baccaratValue。
     */
    const expectedValues = {

        A:
            1,

        2:
            2,

        3:
            3,

        4:
            4,

        5:
            5,

        6:
            6,

        7:
            7,

        8:
            8,

        9:
            9,

        10:
            0,

        J:
            0,

        Q:
            0,

        K:
            0

    };

    for (
        const [
            rank,
            expected
        ] of Object.entries(
            expectedValues
        )
    ) {

        const card =
            new Card(
                rank,
                "C",
                1
            );

        assert(
            card.baccaratValue ===
                expected,
            `${rank} 的 baccaratValue 應為 ${expected}`
        );

    }

    messages.push(
        "✓ baccaratValue 正確"
    );


    /**
     * 6. pairValue。
     */
    const queenHearts =
        new Card(
            "Q",
            "H",
            2
        );

    assert(
        queenHearts.pairValue ===
            "Q",
        "pairValue 應等於 Rank"
    );

    messages.push(
        "✓ pairValue 正確"
    );


    /**
     * 7. isFaceCard / isAce。
     */
    for (
        const rank of
        [
            "10",
            "J",
            "Q",
            "K"
        ]
    ) {

        const card =
            new Card(
                rank,
                "S",
                1
            );

        assert(
            card.isFaceCard === true,
            `${rank} 應為 Face Card`
        );

    }

    const nine =
        new Card(
            "9",
            "S",
            1
        );

    assert(
        nine.isFaceCard === false,
        "9 不應為 Face Card"
    );

    assert(
        aceSpades.isAce === true,
        "A 應為 Ace"
    );

    assert(
        nine.isAce === false,
        "9 不應為 Ace"
    );

    messages.push(
        "✓ isFaceCard 與 isAce 正確"
    );


    /**
     * 8. 顏色。
     */
    const heart =
        new Card(
            "5",
            "H",
            1
        );

    const diamond =
        new Card(
            "5",
            "D",
            1
        );

    const spade =
        new Card(
            "5",
            "S",
            1
        );

    const club =
        new Card(
            "5",
            "C",
            1
        );

    assert(
        heart.isRed === true &&
        diamond.isRed === true,
        "H、D 應為紅色"
    );

    assert(
        spade.isBlack === true &&
        club.isBlack === true,
        "S、C 應為黑色"
    );

    assert(
        heart.isBlack === false,
        "H 不應為黑色"
    );

    assert(
        spade.isRed === false,
        "S 不應為紅色"
    );

    assert(
        heart.color === "red",
        "Heart color 應為 red"
    );

    assert(
        spade.color === "black",
        "Spade color 應為 black"
    );

    messages.push(
        "✓ isRed、isBlack、color 正確"
    );


    /**
     * 9. suitSymbol。
     */
    const expectedSymbols = {

        S:
            "♠",

        H:
            "♥",

        D:
            "♦",

        C:
            "♣"

    };

    for (
        const [
            suit,
            symbol
        ] of Object.entries(
            expectedSymbols
        )
    ) {

        const card =
            new Card(
                "8",
                suit,
                1
            );

        assert(
            card.suitSymbol ===
                symbol,
            `${suit} 的符號應為 ${symbol}`
        );

    }

    messages.push(
        "✓ suitSymbol 正確"
    );


    /**
     * 10. shortName / id / toString()。
     */
    const tenDiamonds =
        new Card(
            "10",
            "D",
            3
        );

    assert(
        tenDiamonds.shortName ===
            "10D",
        "shortName 應為 10D"
    );

    assert(
        tenDiamonds.id ===
            "3-D-10",
        "id 應為 3-D-10"
    );

    assert(
        tenDiamonds.toString() ===
            "10♦",
        "toString() 應為 10♦"
    );

    messages.push(
        "✓ shortName、id、toString() 正確"
    );


    /**
     * 11. equals()。
     */
    const sameAce =
        new Card(
            "A",
            "S",
            1
        );

    const otherDeckAce =
        new Card(
            "A",
            "S",
            2
        );

    const otherSuitAce =
        new Card(
            "A",
            "H",
            1
        );

    assert(
        aceSpades.equals(
            sameAce
        ) === true,
        "相同實體牌應 equals true"
    );

    assert(
        aceSpades.equals(
            otherDeckAce
        ) === false,
        "不同副牌不應相等"
    );

    assert(
        aceSpades.equals(
            otherSuitAce
        ) === false,
        "不同花色不應相等"
    );

    assert(
        aceSpades.equals(
            null
        ) === false,
        "與 null 比較應為 false"
    );

    messages.push(
        "✓ equals() 正確"
    );


    /**
     * 12. toJSON()。
     */
    const json =
        tenDiamonds.toJSON();

    assert(
        json &&
        typeof json ===
            "object",
        "toJSON() 應回傳物件"
    );

    assert(
        json.rank === "10",
        "JSON rank 錯誤"
    );

    assert(
        json.suit === "D",
        "JSON suit 錯誤"
    );

    assert(
        (
            json.deck === 3 ||
            json.deckNumber === 3
        ),
        "JSON deck 錯誤"
    );

    messages.push(
        "✓ toJSON() 正確"
    );


    /**
     * 13. fromJSON()。
     */
    const restored =
        Card.fromJSON(
            json
        );

    assert(
        restored instanceof Card,
        "fromJSON() 應回傳 Card"
    );

    assert(
        restored !==
            tenDiamonds,
        "fromJSON() 不應回傳原物件"
    );

    assert(
        restored.equals(
            tenDiamonds
        ) === true,
        "fromJSON() 還原內容錯誤"
    );

    messages.push(
        "✓ fromJSON() 正確"
    );


    /**
     * 14. fromJSON() 非法資料。
     */
    assertThrows(
        () =>
            Card.fromJSON(
                null
            ),
        "fromJSON(null) 應拋出錯誤"
    );

    assertThrows(
        () =>
            Card.fromJSON({
                rank:
                    "A",
                suit:
                    "X",
                deck:
                    1
            }),
        "fromJSON() 非法 Suit 應拋出錯誤"
    );

    messages.push(
        "✓ fromJSON() 驗證正確"
    );


    /**
     * 15. clone()。
     */
    const cloned =
        queenHearts.clone();

    assert(
        cloned instanceof Card,
        "clone() 應回傳 Card"
    );

    assert(
        cloned !==
            queenHearts,
        "clone() 不應回傳原物件"
    );

    assert(
        cloned.equals(
            queenHearts
        ) === true,
        "clone() 內容應與原牌相同"
    );

    assert(
        cloned.rank ===
            queenHearts.rank &&
        cloned.suit ===
            queenHearts.suit,
        "clone() Rank / Suit 錯誤"
    );

    messages.push(
        "✓ clone() 正確"
    );


    return `
${messages.join("\n")}

Card 測試完成

範例：
Ace：${aceSpades.toString()}
點數：${aceSpades.baccaratValue}
顏色：${aceSpades.color}
ID：${aceSpades.id}

Face Card：${queenHearts.toString()}
Pair Value：${queenHearts.pairValue}
是否人頭牌：${queenHearts.isFaceCard}

JSON 還原：
原牌：${tenDiamonds.toString()}
還原：${restored.toString()}
相同：${restored.equals(tenDiamonds)}
`;
}
