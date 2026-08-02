/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Dealer v3 Test
 *
 * 測試範圍：
 *
 * 1. constructor()
 * 2. reset()
 * 3. newRound()
 * 4. dealInitial()
 * 5. 初始發牌順序
 * 6. Natural
 * 7. Player 第三張
 * 8. Banker 第三張
 * 9. finish()
 * 10. play()
 * 11. DealerState
 * 12. Shoe 扣牌
 * 13. Getter
 * 14. 非法狀態
 * 15. toJSON()
 * 16. fromJSON()
 *
 * 注意：
 *
 * Dealer v3 不負責 Burn。
 * 本測試不建立 Burn，也不呼叫 burn.execute()。
 */

import Dealer, {
    DealerState
} from "../engine/dealer.js";

import Shoe
    from "../engine/shoe.js";

import Card
    from "../engine/card.js";

import Round
    from "../engine/round.js";


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
 * 建立一張牌
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
 * 建立固定抽牌順序的 Shoe
 *
 * Shoe.draw() 使用 cards.pop()，
 * 所以輸入的 drawOrder 必須反轉後存入 cards。
 */
function createShoe(
    drawOrder,
    extraCards = []
) {

    const shoe =
        new Shoe(1);

    shoe.cards = [

        ...extraCards,

        ...[
            ...drawOrder
        ].reverse()

    ];

    shoe.discarded = [];

    shoe.burned = [];

    shoe.unknownBurnedCount = 0;

    return shoe;

}


/**
 * 取得 Card 簡稱
 */
function cardName(card) {

    return card?.shortName ??
        `${card?.rank}${card?.suit}`;

}


/**
 * 檢查牌是否相同
 */
function assertCard(
    card,
    rank,
    suit,
    message
) {

    assert(
        card instanceof Card,
        `${message}：必須是 Card`
    );

    assert(
        card.rank === rank,
        `${message}：Rank 應為 ${rank}，實際為 ${card.rank}`
    );

    assert(
        card.suit === suit,
        `${message}：Suit 應為 ${suit}，實際為 ${card.suit}`
    );

}


/**
 * Dealer v3 完整測試
 */
export default function dealerTest() {

    const messages = [];


    /**
     * 1. constructor() 必須提供 Shoe。
     */
    let missingShoeError =
        null;

    try {

        new Dealer();

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
     * 2. 建立 Dealer 與初始狀態。
     */
    const initialShoe =
        createShoe([

            createCard("2", "S"),
            createCard("3", "H"),
            createCard("4", "D"),
            createCard("5", "C")

        ]);

    const dealer =
        new Dealer(
            initialShoe
        );

    assert(
        dealer.state ===
            DealerState.READY,
        "Dealer 初始狀態應為 READY"
    );

    assert(
        dealer.currentRound === null,
        "初始 currentRound 應為 null"
    );

    assert(
        dealer.finished === false,
        "初始 finished 應為 false"
    );

    assert(
        dealer.result === null,
        "初始 result 應為 null"
    );

    messages.push(
        "✓ Dealer 初始狀態正確"
    );


    /**
     * 3. newRound()。
     */
    const createdRound =
        dealer.newRound();

    assert(
        createdRound instanceof Round,
        "newRound() 應建立 Round"
    );

    assert(
        dealer.currentRound ===
            createdRound,
        "currentRound 應為新建立的 Round"
    );

    assert(
        dealer.state ===
            DealerState.READY,
        "newRound() 後狀態應為 READY"
    );

    assert(
        dealer.playerThirdCard === null,
        "newRound() 應清除 Player 第三張"
    );

    assert(
        dealer.bankerThirdCard === null,
        "newRound() 應清除 Banker 第三張"
    );

    messages.push(
        "✓ newRound() 正確"
    );


    /**
     * 4. dealInitial() 與發牌順序。
     *
     * 抽牌順序：
     * P1 = 2♠
     * B1 = 3♥
     * P2 = 4♦
     * B2 = 5♣
     */
    const beforeInitial =
        initialShoe.remaining;

    const dealtRound =
        dealer.dealInitial();

    assert(
        dealtRound ===
            dealer.currentRound,
        "dealInitial() 應回傳目前 Round"
    );

    assert(
        dealer.state ===
            DealerState.INITIAL_DEALT,
        "初始發牌後狀態應為 INITIAL_DEALT"
    );

    assert(
        dealer.playerHand.count === 2,
        "Player 初始應有兩張牌"
    );

    assert(
        dealer.bankerHand.count === 2,
        "Banker 初始應有兩張牌"
    );

    const playerInitialCards =
        dealer.playerHand.getCards();

    const bankerInitialCards =
        dealer.bankerHand.getCards();

    assertCard(
        playerInitialCards[0],
        "2",
        "S",
        "Player 第一張"
    );

    assertCard(
        bankerInitialCards[0],
        "3",
        "H",
        "Banker 第一張"
    );

    assertCard(
        playerInitialCards[1],
        "4",
        "D",
        "Player 第二張"
    );

    assertCard(
        bankerInitialCards[1],
        "5",
        "C",
        "Banker 第二張"
    );

    assert(
        initialShoe.remaining ===
            beforeInitial - 4,
        "dealInitial() 應從 Shoe 扣除四張牌"
    );

    messages.push(
        "✓ dealInitial() 與 P-B-P-B 發牌順序正確"
    );


    /**
     * 5. dealInitial() 不可重複執行。
     */
    let repeatedInitialError =
        null;

    try {

        dealer.dealInitial();

    }
    catch (error) {

        repeatedInitialError =
            error;

    }

    assert(
        repeatedInitialError instanceof Error,
        "dealInitial() 重複執行應報錯"
    );

    messages.push(
        "✓ dealInitial() 狀態驗證正確"
    );


    /**
     * 6. Natural 牌局。
     *
     * Player：9 + K = 9
     * Banker：5 + 2 = 7
     */
    const naturalShoe =
        createShoe([

            createCard("9", "S"),
            createCard("5", "H"),
            createCard("K", "D"),
            createCard("2", "C")

        ]);

    const naturalDealer =
        new Dealer(
            naturalShoe
        );

    const naturalBefore =
        naturalShoe.remaining;

    const naturalResult =
        naturalDealer.play();

    assert(
        naturalDealer.finished === true,
        "Natural play() 後應完成"
    );

    assert(
        naturalResult.winner ===
            "Player",
        "Natural 範例應為 Player 勝"
    );

    assert(
        naturalDealer.playerHand.count === 2,
        "Natural 時 Player 不應補牌"
    );

    assert(
        naturalDealer.bankerHand.count === 2,
        "Natural 時 Banker 不應補牌"
    );

    assert(
        naturalShoe.remaining ===
            naturalBefore - 4,
        "Natural 牌局只應使用四張牌"
    );

    assert(
        naturalDealer.checkNatural() ===
            true,
        "checkNatural() 應為 true"
    );

    messages.push(
        "✓ Natural 牌局會直接完成"
    );


    /**
     * 7. Player 補牌、Banker 不補牌。
     *
     * Player：2 + 3 = 5，補 4 → 9
     * Banker：6 + 1 = 7，不補
     */
    const playerDrawShoe =
        createShoe([

            createCard("2", "S"),
            createCard("6", "H"),
            createCard("3", "D"),
            createCard("A", "C"),
            createCard("4", "S")

        ]);

    const playerDrawDealer =
        new Dealer(
            playerDrawShoe
        );

    playerDrawDealer.newRound();
    playerDrawDealer.dealInitial();

    assert(
        playerDrawDealer.checkNatural() ===
            false,
        "Player 補牌範例不應為 Natural"
    );

    const playerThird =
        playerDrawDealer
            .playPlayerThirdCard();

    assertCard(
        playerThird,
        "4",
        "S",
        "Player 第三張"
    );

    assert(
        playerDrawDealer.state ===
            DealerState.PLAYER_THIRD,
        "Player 第三張後狀態應為 PLAYER_THIRD"
    );

    const bankerThirdWhenStanding =
        playerDrawDealer
            .playBankerThirdCard();

    assert(
        bankerThirdWhenStanding === null,
        "Banker 7 點不應補牌"
    );

    assert(
        playerDrawDealer.state ===
            DealerState.BANKER_THIRD,
        "處理 Banker 後狀態應為 BANKER_THIRD"
    );

    const playerDrawResult =
        playerDrawDealer.finish();

    assert(
        playerDrawResult.winner ===
            "Player",
        "Player 補牌範例應為 Player 勝"
    );

    assert(
        playerDrawDealer.playerHand.count === 3,
        "Player 應有三張牌"
    );

    assert(
        playerDrawDealer.bankerHand.count === 2,
        "Banker 應維持兩張牌"
    );

    messages.push(
        "✓ Player 第三張流程正確"
    );


    /**
     * 8. Player 停牌、Banker 補牌。
     *
     * Player：4 + 2 = 6，停牌
     * Banker：2 + 3 = 5，補 4 → 9
     */
    const bankerDrawShoe =
        createShoe([

            createCard("4", "S"),
            createCard("2", "H"),
            createCard("2", "D"),
            createCard("3", "C"),
            createCard("4", "H")

        ]);

    const bankerDrawDealer =
        new Dealer(
            bankerDrawShoe
        );

    bankerDrawDealer.newRound();
    bankerDrawDealer.dealInitial();

    const noPlayerThird =
        bankerDrawDealer
            .playPlayerThirdCard();

    assert(
        noPlayerThird === null,
        "Player 6 點不應補牌"
    );

    const bankerThird =
        bankerDrawDealer
            .playBankerThirdCard();

    assertCard(
        bankerThird,
        "4",
        "H",
        "Banker 第三張"
    );

    const bankerDrawResult =
        bankerDrawDealer.finish();

    assert(
        bankerDrawResult.winner ===
            "Banker",
        "Banker 補牌範例應為 Banker 勝"
    );

    assert(
        bankerDrawDealer.playerHand.count === 2,
        "Player 應維持兩張牌"
    );

    assert(
        bankerDrawDealer.bankerHand.count === 3,
        "Banker 應有三張牌"
    );

    messages.push(
        "✓ Banker 第三張流程正確"
    );


    /**
     * 9. Player 與 Banker 都補牌。
     *
     * Player：2 + 2 = 4，補 6 → 0
     * Banker：2 + 2 = 4，Player 第三張為 6，
     * Banker 4 點符合補牌規則，補 5 → 9
     */
    const bothDrawShoe =
        createShoe([

            createCard("2", "S"),
            createCard("2", "H"),
            createCard("2", "D"),
            createCard("2", "C"),
            createCard("6", "S"),
            createCard("5", "H")

        ]);

    const bothDrawDealer =
        new Dealer(
            bothDrawShoe
        );

    const bothDrawBefore =
        bothDrawShoe.remaining;

    const bothDrawResult =
        bothDrawDealer.play();

    assert(
        bothDrawDealer.playerHand.count === 3,
        "Player 應補第三張"
    );

    assert(
        bothDrawDealer.bankerHand.count === 3,
        "Banker 應補第三張"
    );

    assert(
        bothDrawShoe.remaining ===
            bothDrawBefore - 6,
        "雙方補牌時應使用六張牌"
    );

    assert(
        bothDrawResult.winner ===
            "Banker",
        "雙方補牌範例應為 Banker 勝"
    );

    messages.push(
        "✓ 雙方第三張規則正確"
    );


    /**
     * 10. finish() 重複呼叫。
     */
    const firstFinishResult =
        bothDrawDealer.result;

    const repeatedFinishResult =
        bothDrawDealer.finish();

    assert(
        repeatedFinishResult ===
            firstFinishResult,
        "重複 finish() 應回傳相同 RoundResult"
    );

    messages.push(
        "✓ finish() 可安全重複呼叫"
    );


    /**
     * 11. READY 狀態不可 finish()。
     */
    const readyDealer =
        new Dealer(
            createShoe([
                createCard("A", "S"),
                createCard("2", "H"),
                createCard("3", "D"),
                createCard("4", "C")
            ])
        );

    readyDealer.newRound();

    let earlyFinishError =
        null;

    try {

        readyDealer.finish();

    }
    catch (error) {

        earlyFinishError =
            error;

    }

    assert(
        earlyFinishError instanceof Error,
        "初始發牌前 finish() 應報錯"
    );

    messages.push(
        "✓ finish() 狀態驗證正確"
    );


    /**
     * 12. 第三張方法狀態驗證。
     */
    const stateDealer =
        new Dealer(
            createShoe([
                createCard("A", "S"),
                createCard("2", "H"),
                createCard("3", "D"),
                createCard("4", "C"),
                createCard("5", "S"),
                createCard("6", "H")
            ])
        );

    stateDealer.newRound();

    let earlyPlayerThirdError =
        null;

    try {

        stateDealer
            .playPlayerThirdCard();

    }
    catch (error) {

        earlyPlayerThirdError =
            error;

    }

    assert(
        earlyPlayerThirdError instanceof Error,
        "初始發牌前不可處理 Player 第三張"
    );

    let earlyBankerThirdError =
        null;

    try {

        stateDealer
            .playBankerThirdCard();

    }
    catch (error) {

        earlyBankerThirdError =
            error;

    }

    assert(
        earlyBankerThirdError instanceof Error,
        "Player 第三張階段前不可處理 Banker"
    );

    messages.push(
        "✓ 第三張方法狀態驗證正確"
    );


    /**
     * 13. Getter。
     */
    assert(
        bothDrawDealer.playerScore ===
            bothDrawDealer
                .playerHand.value,
        "playerScore getter 錯誤"
    );

    assert(
        bothDrawDealer.bankerScore ===
            bothDrawDealer
                .bankerHand.value,
        "bankerScore getter 錯誤"
    );

    assert(
        bothDrawDealer.winner ===
            bothDrawResult.winner,
        "winner getter 錯誤"
    );

    assert(
        bothDrawDealer.result ===
            bothDrawResult,
        "result getter 錯誤"
    );

    messages.push(
        "✓ Dealer getters 正確"
    );


    /**
     * 14. reset()。
     */
    bothDrawDealer.reset();

    assert(
        bothDrawDealer.state ===
            DealerState.READY,
        "reset() 後狀態應為 READY"
    );

    assert(
        bothDrawDealer.currentRound ===
            null,
        "reset() 後 Round 應為 null"
    );

    assert(
        bothDrawDealer.playerThirdCard ===
            null,
        "reset() 應清除 Player 第三張"
    );

    assert(
        bothDrawDealer.bankerThirdCard ===
            null,
        "reset() 應清除 Banker 第三張"
    );

    messages.push(
        "✓ reset() 正確"
    );


    /**
     * 15. toJSON() / fromJSON()。
     */
    const jsonShoe =
        createShoe([

            createCard("3", "S"),
            createCard("4", "H"),
            createCard("2", "D"),
            createCard("3", "C"),
            createCard("6", "S"),
            createCard("7", "H")

        ]);

    const jsonDealer =
        new Dealer(
            jsonShoe
        );

    jsonDealer.newRound();
    jsonDealer.dealInitial();
    jsonDealer.playPlayerThirdCard();
    jsonDealer.playBankerThirdCard();

    const json =
        jsonDealer.toJSON();

    assert(
        json.state ===
            DealerState.BANKER_THIRD,
        "toJSON() state 錯誤"
    );

    assert(
        json.round !== null,
        "toJSON() 應包含 Round"
    );

    const restored =
        Dealer.fromJSON(
            json,
            jsonShoe
        );

    assert(
        restored instanceof Dealer,
        "fromJSON() 應回傳 Dealer"
    );

    assert(
        restored.state ===
            jsonDealer.state,
        "還原後 state 不一致"
    );

    assert(
        restored.playerHand.count ===
            jsonDealer.playerHand.count,
        "還原後 Player 手牌數不一致"
    );

    assert(
        restored.bankerHand.count ===
            jsonDealer.bankerHand.count,
        "還原後 Banker 手牌數不一致"
    );

    assert(
        restored.playerScore ===
            jsonDealer.playerScore,
        "還原後 Player 點數不一致"
    );

    assert(
        restored.bankerScore ===
            jsonDealer.bankerScore,
        "還原後 Banker 點數不一致"
    );

    messages.push(
        "✓ toJSON() / fromJSON() 正確"
    );


    /**
     * 16. fromJSON() 驗證。
     */
    let missingDataError =
        null;

    try {

        Dealer.fromJSON(
            null,
            jsonShoe
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

    let invalidStateError =
        null;

    try {

        Dealer.fromJSON(
            {
                state:
                    "INVALID"
            },
            jsonShoe
        );

    }
    catch (error) {

        invalidStateError =
            error;

    }

    assert(
        invalidStateError instanceof Error,
        "fromJSON() 非法 state 應報錯"
    );

    messages.push(
        "✓ fromJSON() 驗證正確"
    );


    return `
${messages.join("\n")}

Dealer v3 測試完成

Natural 範例：
Player：${naturalDealer.playerScore}
Banker：${naturalDealer.bankerScore}
勝方：${naturalResult.winner}
使用牌數：4

Player 補牌範例：
Player 第三張：${cardName(playerThird)}
Player：${playerDrawDealer.playerScore}
Banker：${playerDrawDealer.bankerScore}
勝方：${playerDrawResult.winner}

Banker 補牌範例：
Banker 第三張：${cardName(bankerThird)}
Player：${bankerDrawDealer.playerScore}
Banker：${bankerDrawDealer.bankerScore}
勝方：${bankerDrawResult.winner}

雙方補牌範例：
Player：${bothDrawResult.playerScore ?? "已重置"}
Banker：${bothDrawResult.bankerScore ?? "已重置"}
勝方：${bothDrawResult.winner}
`;
}
