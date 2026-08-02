/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Shoe v6
 *
 * 百家樂牌靴
 *
 * 支援：
 *
 * 1. 多副牌建立
 * 2. 洗牌
 * 3. 自動抽牌
 * 4. 手動移除公開牌
 * 5. 已知棄牌
 * 6. 已知燒牌
 * 7. 未知燒牌張數
 * 8. 可知牌池剩餘數
 * 9. 物理牌靴剩餘數
 * 10. JSON 匯出／還原
 *
 * 未知燒牌設計：
 *
 * 隱藏燒牌的牌面未知，因此不會從 cards 陣列中
 * 任意移除具體牌面。
 *
 * cards.length：
 * 分析器仍可能看到的牌面集合。
 *
 * unknownBurnedCount：
 * 實際已離開牌靴，但身分未知的牌數。
 *
 * physicalRemaining：
 * cards.length - unknownBurnedCount
 */

import Deck
    from "./deck.js";

import Card
    from "./card.js";


const DEFAULT_DECK_COUNT = 8;


export default class Shoe {

    constructor(
        deckCount =
            DEFAULT_DECK_COUNT
    ) {

        this.validateDeckCount(
            deckCount
        );

        this.deckCount =
            deckCount;

        this.cards = [];

        /**
         * 已公開並從牌靴移除的牌。
         *
         * 包含：
         * - 荷官已發出的牌
         * - 公開的燒牌指示牌
         * - 手動移除牌
         */
        this.discarded = [];

        /**
         * 已知牌面的燒牌。
         *
         * 保留給舊版流程或特殊情況。
         * 新版隱藏燒牌不應放入此陣列。
         */
        this.burned = [];

        /**
         * 不公開牌面的燒牌張數。
         *
         * 只記錄數量，不建立虛構 Card。
         */
        this.unknownBurnedCount = 0;

        this.createdAt = null;

        this.shuffledAt = null;

        this.create();

    }


    /**
     * 驗證副牌數
     */
    validateDeckCount(deckCount) {

        if (
            !Number.isInteger(
                deckCount
            ) ||
            deckCount < 1
        ) {

            throw new RangeError(
                "deckCount must be a positive integer."
            );

        }

        return deckCount;

    }


    /**
     * 建立完整牌靴
     */
    create() {

        this.cards = [];

        this.discarded = [];

        this.burned = [];

        this.unknownBurnedCount = 0;


        for (
            let deckNumber = 1;
            deckNumber <=
                this.deckCount;
            deckNumber++
        ) {

            const deck =
                new Deck(
                    deckNumber
                );

            /**
             * 相容兩種 Deck：
             *
             * 1. Constructor 已自動 create()
             * 2. Constructor 後需要手動 create()
             */
            if (
                deck.count === 0 &&
                typeof deck.create ===
                    "function"
            ) {

                deck.create();

            }


            const cards =

                typeof deck.getCards ===
                    "function"

                    ? deck.getCards()

                    : [
                        ...deck.cards
                    ];


            this.cards.push(
                ...cards
            );

        }


        this.createdAt =
            Date.now();

        this.shuffledAt = null;

        return this;

    }


    /**
     * 理論總牌數
     */
    get total() {

        return (
            this.deckCount * 52
        );

    }


    /**
     * 可知牌池剩餘數
     *
     * 已扣除：
     * - 公開燒牌指示牌
     * - 所有已輸入的公開牌
     *
     * 尚未按具體牌面扣除：
     * - 不公開的隱藏燒牌
     */
    get remaining() {

        return this.cards.length;

    }


    /**
     * remaining 的語意化別名
     */
    get knownRemaining() {

        return this.remaining;

    }


    /**
     * 分析器可觀察牌池剩餘數
     */
    get observableRemaining() {

        return this.remaining;

    }


    /**
     * 牌靴物理剩餘張數
     *
     * 可知牌池仍包含未知燒牌可能是哪些牌，
     * 因此物理數量需要再扣除未知燒牌張數。
     */
    get physicalRemaining() {

        return Math.max(

            0,

            this.remaining -
            this.unknownBurnedCount

        );

    }


    /**
     * 已知移除張數
     *
     * 不包含未知燒牌。
     */
    get knownRemovedCount() {

        return (
            this.discarded.length +
            this.burned.length
        );

    }


    /**
     * 實際物理移除總數
     */
    get physicalRemovedCount() {

        return (
            this.knownRemovedCount +
            this.unknownBurnedCount
        );

    }


    /**
     * 舊版相容：
     * 已使用牌數
     *
     * 主要代表已公開、已棄置的牌。
     */
    get used() {

        return this.discarded.length;

    }


    /**
     * 全部已知移除牌
     */
    get knownRemovedCards() {

        return [

            ...this.discarded,

            ...this.burned

        ];

    }


    /**
     * 發牌歷史
     */
    get history() {

        return [
            ...this.discarded
        ];

    }


    /**
     * 可知牌池剩餘比例
     */
    get observableRemainingRatio() {

        if (this.total === 0) {

            return 0;

        }

        return (
            this.observableRemaining /
            this.total
        );

    }


    /**
     * 物理牌靴剩餘比例
     */
    get physicalRemainingRatio() {

        if (this.total === 0) {

            return 0;

        }

        return (
            this.physicalRemaining /
            this.total
        );

    }


    /**
     * 舊版相容。
     *
     * UI 的牌靴剩餘比例應採用實際物理數量。
     */
    get remainingRatio() {

        return this.physicalRemainingRatio;

    }


    /**
     * 是否為空
     *
     * 以物理牌數判斷。
     */
    get isEmpty() {

        return (
            this.physicalRemaining <= 0
        );

    }


    /**
     * 是否還有可知牌面
     */
    get hasObservableCards() {

        return this.remaining > 0;

    }


    /**
     * Fisher-Yates 洗牌
     */
    shuffle() {

        for (
            let index =
                this.cards.length - 1;

            index > 0;

            index--
        ) {

            const randomIndex =
                Math.floor(
                    Math.random() *
                    (index + 1)
                );

            [
                this.cards[index],
                this.cards[randomIndex]
            ] = [
                this.cards[randomIndex],
                this.cards[index]
            ];

        }

        this.shuffledAt =
            Date.now();

        return this;

    }


    /**
     * 自動抽一張牌
     *
     * 主要供測試、模擬與 Dealer 使用。
     *
     * 正式荷官輸入流程應優先使用 remove()。
     */
    draw() {

        if (
            this.physicalRemaining <= 0
        ) {

            return null;

        }

        const card =
            this.cards.pop() ??
            null;

        if (!card) {

            return null;

        }

        this.discarded.push(
            card
        );

        return card;

    }


    /**
     * 查看可知牌池
     *
     * 回傳副本。
     */
    peek() {

        return [
            ...this.cards
        ];

    }


    /**
     * 查看最上方一張
     */
    peekTop() {

        return (
            this.cards.at(-1) ??
            null
        );

    }


    /**
     * 判斷兩張牌是否相同
     */
    cardsEqual(
        left,
        right
    ) {

        if (!left || !right) {

            return false;

        }

        if (
            typeof left.equals ===
                "function"
        ) {

            return left.equals(
                right
            );

        }


        if (
            left.id !== undefined &&
            right.id !== undefined
        ) {

            return (
                left.id === right.id
            );

        }


        const leftDeck =
            left.deck ??
            left.deckNumber ??
            null;

        const rightDeck =
            right.deck ??
            right.deckNumber ??
            null;


        return (

            left.rank === right.rank &&

            left.suit === right.suit &&

            (
                leftDeck === null ||
                rightDeck === null ||
                leftDeck === rightDeck
            )

        );

    }


    /**
     * 解析牌靴中的實際 Card
     *
     * 支援：
     *
     * Card
     *
     * {
     *     rank: "A",
     *     suit: "S"
     * }
     *
     * {
     *     rank: "A",
     *     suit: "S",
     *     deck: 3
     * }
     */
    resolveCard(input) {

        if (!input) {

            throw new Error(
                "Card is required."
            );

        }


        let rank;

        let suit;

        let deckNumber;


        if (input instanceof Card) {

            rank =
                input.rank;

            suit =
                input.suit;

            deckNumber =
                input.deck ??
                input.deckNumber ??
                null;

        }
        else if (
            typeof input ===
                "object" &&
            !Array.isArray(input)
        ) {

            rank =
                input.rank;

            suit =
                input.suit;

            deckNumber =
                input.deck ??
                input.deckNumber ??
                null;

        }
        else {

            throw new TypeError(
                "Card must be a Card or card data object."
            );

        }


        if (!rank || !suit) {

            throw new Error(
                "Card rank and suit are required."
            );

        }


        const matched =
            this.cards.find(
                card => {

                    const cardDeck =
                        card.deck ??
                        card.deckNumber ??
                        null;

                    const sameDeck =

                        deckNumber === null ||

                        cardDeck ===
                            deckNumber;


                    return (

                        card.rank === rank &&

                        card.suit === suit &&

                        sameDeck

                    );

                }
            );


        if (!matched) {

            throw new Error(
                `Card is not available in shoe: ${rank}${suit}`
            );

        }

        return matched;

    }


    /**
     * 手動移除一張公開牌
     *
     * 適用於：
     *
     * - 燒牌指示牌
     * - Player 手牌
     * - Banker 手牌
     *
     * 移除後會放入 discarded。
     */
    remove(input) {

        const card =
            this.resolveCard(
                input
            );

        const index =
            this.cards.findIndex(
                item =>
                    this.cardsEqual(
                        item,
                        card
                    )
            );


        if (index < 0) {

            throw new Error(
                "Card was not found in shoe."
            );

        }


        const [
            removed
        ] =
            this.cards.splice(
                index,
                1
            );


        this.discarded.push(
            removed
        );

        return removed;

    }


    /**
     * 移除一張已知燒牌
     *
     * 新版隱藏燒牌不應使用這個方法。
     *
     * 此方法主要保留給：
     *
     * - 舊版相容
     * - 已公開的額外燒牌
     */
    burn(input) {

        let card = null;


        /**
         * 牌仍在可知牌池。
         */
        try {

            card =
                this.resolveCard(
                    input
                );

        }
        catch {

            card = null;

        }


        if (card) {

            const index =
                this.cards.findIndex(
                    item =>
                        this.cardsEqual(
                            item,
                            card
                        )
                );

            const [
                removed
            ] =
                this.cards.splice(
                    index,
                    1
                );

            this.burned.push(
                removed
            );

            return removed;

        }


        /**
         * 牌可能已由 draw() 或 remove()
         * 放入 discarded。
         *
         * 此時移到 burned，避免重複計數。
         */
        const discardedIndex =
            this.discarded
                .findLastIndex(
                    item =>
                        this.cardsEqual(
                            item,
                            input
                        )
                );


        if (discardedIndex < 0) {

            throw new Error(
                "Burn card was not found."
            );

        }


        const [
            removed
        ] =
            this.discarded.splice(
                discardedIndex,
                1
            );


        this.burned.push(
            removed
        );

        return removed;

    }


    /**
     * 記錄未知燒牌張數
     *
     * 不會從 cards 中移除任何具體牌面。
     */
    registerUnknownBurn(
        count
    ) {

        if (
            !Number.isInteger(count) ||
            count < 0
        ) {

            throw new RangeError(
                "Unknown burn count must be a non-negative integer."
            );

        }


        if (
            count >
            this.remaining -
            this.unknownBurnedCount
        ) {

            throw new Error(
                "Unknown burn count exceeds remaining physical cards."
            );

        }


        this.unknownBurnedCount +=
            count;

        return this.unknownBurnedCount;

    }


    /**
     * 設定未知燒牌總數
     *
     * 適合 JSON 還原或狀態同步。
     */
    setUnknownBurnedCount(
        count
    ) {

        if (
            !Number.isInteger(count) ||
            count < 0
        ) {

            throw new RangeError(
                "Unknown burn count must be a non-negative integer."
            );

        }


        if (
            count >
            this.remaining
        ) {

            throw new Error(
                "Unknown burn count exceeds observable remaining cards."
            );

        }


        this.unknownBurnedCount =
            count;

        return this;

    }


    /**
     * 清除未知燒牌紀錄
     *
     * 只應用於重置或測試。
     */
    clearUnknownBurn() {

        this.unknownBurnedCount = 0;

        return this;

    }


    /**
     * 將最後一張 discarded 放回牌靴
     *
     * 用於手動輸入撤銷。
     *
     * 不保證恢復原洗牌位置，
     * 但分析使用牌面組成，因此不受順序影響。
     */
    restoreLastDiscarded() {

        const card =
            this.discarded.pop() ??
            null;

        if (!card) {

            return null;

        }


        const alreadyExists =
            this.cards.some(
                item =>
                    this.cardsEqual(
                        item,
                        card
                    )
            );


        if (alreadyExists) {

            this.discarded.push(
                card
            );

            throw new Error(
                "Card already exists in shoe."
            );

        }


        this.cards.push(
            card
        );

        return card;

    }


    /**
     * 將指定 discarded 放回牌靴
     *
     * 用於撤銷手動輸入。
     */
    restore(input) {

        if (!input) {

            throw new Error(
                "Card is required."
            );

        }


        const index =
            this.discarded
                .findLastIndex(
                    item =>
                        this.cardsEqual(
                            item,
                            input
                        )
                );


        if (index < 0) {

            throw new Error(
                "Card was not found in discarded cards."
            );

        }


        const [
            card
        ] =
            this.discarded.splice(
                index,
                1
            );


        const alreadyExists =
            this.cards.some(
                item =>
                    this.cardsEqual(
                        item,
                        card
                    )
            );


        if (alreadyExists) {

            this.discarded.splice(
                index,
                0,
                card
            );

            throw new Error(
                "Card already exists in shoe."
            );

        }


        this.cards.push(
            card
        );

        return card;

    }


    /**
     * 是否含有指定牌
     */
    has(input) {

        if (!input) {

            return false;

        }

        return this.cards.some(
            card =>
                this.cardsEqual(
                    card,
                    input
                )
        );

    }


    /**
     * 計算指定 rank / suit 的剩餘數量
     */
    countCard(
        rank,
        suit = null
    ) {

        return this.cards.filter(
            card => {

                if (
                    card.rank !== rank
                ) {

                    return false;

                }

                if (
                    suit !== null &&
                    card.suit !== suit
                ) {

                    return false;

                }

                return true;

            }
        ).length;

    }


    /**
     * 依百家樂點數統計可知牌池
     */
    get baccaratValueCounts() {

        const counts = {

            0: 0,
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0,
            7: 0,
            8: 0,
            9: 0

        };


        for (
            const card of
            this.cards
        ) {

            counts[
                card.baccaratValue
            ]++;

        }

        return counts;

    }


    /**
     * 牌靴摘要
     */
    get summary() {

        return {

            deckCount:
                this.deckCount,

            total:
                this.total,

            observableRemaining:
                this.observableRemaining,

            knownRemaining:
                this.knownRemaining,

            unknownBurnedCount:
                this.unknownBurnedCount,

            physicalRemaining:
                this.physicalRemaining,

            discarded:
                this.discarded.length,

            burned:
                this.burned.length,

            knownRemoved:
                this.knownRemovedCount,

            physicalRemoved:
                this.physicalRemovedCount,

            observableRemainingRatio:
                this.observableRemainingRatio,

            physicalRemainingRatio:
                this.physicalRemainingRatio,

            isEmpty:
                this.isEmpty

        };

    }


    /**
     * 重置並重新建立牌靴
     */
    reset({

        shuffle = true

    } = {}) {

        this.create();

        if (shuffle) {

            this.shuffle();

        }

        return this;

    }


    /**
     * 深度複製
     */
    clone() {

        return Shoe.fromJSON(
            this.toJSON()
        );

    }


    /**
     * JSON
     */
    toJSON() {

        return {

            version: 6,

            deckCount:
                this.deckCount,

            cards:
                this.cards.map(
                    card =>
                        card.toJSON()
                ),

            discarded:
                this.discarded.map(
                    card =>
                        card.toJSON()
                ),

            burned:
                this.burned.map(
                    card =>
                        card.toJSON()
                ),

            unknownBurnedCount:
                this.unknownBurnedCount,

            createdAt:
                this.createdAt,

            shuffledAt:
                this.shuffledAt

        };

    }


    /**
     * JSON 還原
     */
    static fromJSON(data) {

        if (
            !data ||
            typeof data !==
                "object" ||
            Array.isArray(data)
        ) {

            throw new Error(
                "Shoe data is required."
            );

        }


        const deckCount =
            data.deckCount ??
            DEFAULT_DECK_COUNT;


        const shoe =
            Object.create(
                Shoe.prototype
            );


        shoe.validateDeckCount(
            deckCount
        );


        shoe.deckCount =
            deckCount;


        shoe.cards =
            Array.isArray(
                data.cards
            )
                ? data.cards.map(
                    card =>
                        Card.fromJSON(card)
                )
                : [];


        shoe.discarded =
            Array.isArray(
                data.discarded
            )
                ? data.discarded.map(
                    card =>
                        Card.fromJSON(card)
                )
                : [];


        shoe.burned =
            Array.isArray(
                data.burned
            )
                ? data.burned.map(
                    card =>
                        Card.fromJSON(card)
                )
                : [];


        shoe.unknownBurnedCount =
            Number.isInteger(
                data.unknownBurnedCount
            ) &&
            data.unknownBurnedCount >= 0

                ? data.unknownBurnedCount

                : 0;


        if (
            shoe.unknownBurnedCount >
            shoe.cards.length
        ) {

            throw new Error(
                "Unknown burn count exceeds observable remaining cards."
            );

        }


        shoe.createdAt =
            Number.isFinite(
                data.createdAt
            )
                ? data.createdAt
                : null;


        shoe.shuffledAt =
            Number.isFinite(
                data.shuffledAt
            )
                ? data.shuffledAt
                : null;


        return shoe;

    }

}
