/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Burn v6
 *
 * 百家樂燒牌管理器
 *
 * 正式流程：
 *
 * 1. 建立新牌靴
 * 2. 手動輸入公開的燒牌指示牌
 * 3. 從可知牌池移除指示牌
 * 4. 依指示牌計算隱藏燒牌數
 * 5. 隱藏燒牌只記錄張數，不建立虛構牌面
 *
 * 例如：
 *
 * 指示牌為 7♥
 *
 * indicatorCount = 1
 * hiddenCount    = 7
 * totalRemoved   = 8
 *
 * Shoe 的已知牌池只移除 7♥。
 * 另外七張隱藏牌的身分未知，因此不從已知牌池
 * 任意挑選具體牌面移除。
 */

import Card
    from "./card.js";


export const BurnState =
    Object.freeze({

        WAITING_INDICATOR:
            "WAITING_INDICATOR",

        CONFIRMED:
            "CONFIRMED"

    });


export default class Burn {

    constructor(shoe) {

        if (!shoe) {

            throw new Error(
                "Shoe is required."
            );

        }

        this.shoe = shoe;

        this.reset();

    }


    /**
     * 重置燒牌資料
     *
     * 注意：
     * reset() 不會把已移除的指示牌放回 Shoe。
     * 一般情況應在建立新牌靴時建立新的 Burn。
     */
    reset() {

        this.state =
            BurnState
                .WAITING_INDICATOR;

        this.indicator = null;

        this.hiddenCount = 0;

        this.confirmedAt = null;

        return this;

    }


    /**
     * 是否已完成燒牌確認
     */
    get isConfirmed() {

        return (
            this.state ===
            BurnState.CONFIRMED
        );

    }


    /**
     * 相容舊版名稱
     */
    get isExecuted() {

        return this.isConfirmed;

    }


    /**
     * 公開指示牌張數
     */
    get indicatorCount() {

        return this.indicator
            ? 1
            : 0;

    }


    /**
     * 相容舊版 amount
     *
     * amount 表示隱藏燒牌張數。
     */
    get amount() {

        return this.hiddenCount;

    }


    /**
     * 總移除張數
     *
     * 指示牌 1 張
     * 加上隱藏燒牌張數。
     */
    get totalRemoved() {

        return (
            this.indicatorCount +
            this.hiddenCount
        );

    }


    /**
     * 相容舊版 count
     *
     * count 回傳總燒牌張數。
     */
    get count() {

        return this.totalRemoved;

    }


    /**
     * 可知牌池剩餘張數
     *
     * Shoe 中只扣除已知牌面：
     *
     * - 指示牌
     * - 後續公開的 Player / Banker 牌
     *
     * 不扣除身分未知的隱藏燒牌。
     */
    get observableRemaining() {

        return (
            this.shoe?.remaining ??
            0
        );

    }


    /**
     * 實際物理牌靴剩餘張數
     *
     * Shoe.remaining 尚包含身分未知的隱藏燒牌，
     * 因此需要再扣除 hiddenCount。
     */
    get physicalRemaining() {

        return (
            this.shoe
                ?.physicalRemaining ??
            0
        );

    }


    /**
     * 依百家樂規則計算隱藏燒牌數
     *
     * A          → 1
     * 2 ～ 9     → 牌面點數
     * 10 / J/Q/K → 10
     */
    calculate(card) {

        this.validateCard(card);

        switch (card.rank) {

            case "A":

                return 1;

            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":

                return Number(
                    card.rank
                );

            case "10":
            case "J":
            case "Q":
            case "K":

                return 10;

            default:

                throw new Error(
                    `Invalid burn indicator rank: ${card.rank}`
                );

        }

    }


    /**
     * 驗證 Card
     */
    validateCard(card) {

        if (!(card instanceof Card)) {

            throw new TypeError(
                "Burn indicator must be a Card."
            );

        }

        return card;

    }


    /**
     * 取得 Shoe 內目前的牌陣列副本
     */
    getRemainingCards() {

        if (
            typeof this.shoe.peek ===
            "function"
        ) {

            return this.shoe.peek();

        }

        if (
            Array.isArray(
                this.shoe.cards
            )
        ) {

            return [
                ...this.shoe.cards
            ];

        }

        throw new Error(
            "Shoe does not expose remaining cards."
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
     * 從 Shoe 解析真正存在的指示牌
     *
     * 支援：
     *
     * Card
     *
     * {
     *     rank: "7",
     *     suit: "H"
     * }
     *
     * {
     *     rank: "7",
     *     suit: "H",
     *     deck: 3
     * }
     */
    resolveIndicator(input) {

        if (!input) {

            throw new Error(
                "Burn indicator is required."
            );

        }


        let rank;

        let suit;

        let deckNumber;


        if (input instanceof Card) {

            rank = input.rank;

            suit = input.suit;

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

            rank = input.rank;

            suit = input.suit;

            deckNumber =
                input.deck ??
                input.deckNumber ??
                null;

        }
        else {

            throw new TypeError(
                "Burn indicator must be a Card or card data object."
            );

        }


        if (!rank || !suit) {

            throw new Error(
                "Burn indicator rank and suit are required."
            );

        }


        const matched =
            this.getRemainingCards()
                .find(
                    card => {

                        const cardDeck =
                            card.deck ??
                            card.deckNumber ??
                            null;

                        const deckMatches =

                            deckNumber === null ||

                            cardDeck ===
                                deckNumber;

                        return (

                            card.rank === rank &&

                            card.suit === suit &&

                            deckMatches

                        );

                    }
                );


        if (!matched) {

            throw new Error(
                `Burn indicator is not available in shoe: ${rank}${suit}`
            );

        }

        return matched;

    }


    /**
     * 從 Shoe 移除公開指示牌
     */
    removeIndicatorFromShoe(card) {

        const before =
            this.shoe.remaining;


        if (
            typeof this.shoe.remove ===
                "function"
        ) {

            const removed =
                this.shoe.remove(
                    card
                );

            /**
             * Shoe.remove() 可能：
             *
             * - 回傳被移除的牌
             * - 回傳 true / false
             * - 不回傳任何值
             *
             * 因此最後以 remaining 變化為準。
             */
            if (
                this.shoe.remaining !==
                before - 1
            ) {

                throw new Error(
                    "Failed to remove burn indicator from shoe."
                );

            }

            return (
                removed ??
                card
            );

        }


        if (
            !Array.isArray(
                this.shoe.cards
            )
        ) {

            throw new Error(
                "Shoe does not support card removal."
            );

        }


        const index =
            this.shoe.cards.findIndex(
                item =>
                    this.cardsEqual(
                        item,
                        card
                    )
            );


        if (index < 0) {

            throw new Error(
                "Burn indicator was not found in shoe."
            );

        }


        const [
            removed
        ] =
            this.shoe.cards.splice(
                index,
                1
            );


        /**
         * 已知指示牌屬於已使用牌。
         */
        if (
            Array.isArray(
                this.shoe.discarded
            )
        ) {

            this.shoe.discarded.push(
                removed
            );

        }

        return removed;

    }


    /**
     * 確認燒牌指示牌
     *
     * 這是正式主流程入口。
     */
    confirmIndicator(input) {

        if (this.isConfirmed) {

            throw new Error(
                "Burn indicator has already been confirmed."
            );

        }


        const indicator =
            this.resolveIndicator(
                input
            );

        const hiddenCount =
            this.calculate(
                indicator
            );


        /**
         * 先檢查物理牌數是否合理。
         *
         * 指示牌目前仍在 Shoe，
         * 所以至少需要：
         *
         * 1 張指示牌 + hiddenCount 張隱藏牌。
         */
        if (
            this.shoe.remaining <
            1 + hiddenCount
        ) {

            throw new Error(
                "Not enough cards remaining for burn procedure."
            );

        }


        const removedIndicator =
            this.removeIndicatorFromShoe(
                indicator
            );

        this.shoe.registerUnknownBurn(
            hiddenCount
        );

        this.indicator =
            removedIndicator;

        this.hiddenCount =
            hiddenCount;

        this.state =
            BurnState.CONFIRMED;

        this.confirmedAt =
            Date.now();


        return this.info;

    }


    /**
     * 相容舊版 execute()
     *
     * 舊版 execute() 會由系統自動抽指示牌；
     * 新版禁止自動抽取，必須傳入荷官公開的指示牌。
     */
    execute(input) {

        if (!input) {

            throw new Error(
                "Burn indicator must be entered manually."
            );

        }

        return this.confirmIndicator(
            input
        );

    }


    /**
     * 燒牌資訊
     */
    get info() {

        return {

            state:
                this.state,

            confirmed:
                this.isConfirmed,

            indicator:
                this.indicator,

            indicatorCount:
                this.indicatorCount,

            hiddenCount:
                this.hiddenCount,

            amount:
                this.hiddenCount,

            totalRemoved:
                this.totalRemoved,

            observableRemaining:
                this.observableRemaining,

            physicalRemaining:
                this.physicalRemaining,

            confirmedAt:
                this.confirmedAt

        };

    }


    /**
     * JSON
     */
    toJSON() {

        return {

            version: 6,

            state:
                this.state,

            confirmed:
                this.isConfirmed,

            indicator:
                this.indicator
                    ? this.indicator
                        .toJSON()
                    : null,

            hiddenCount:
                this.hiddenCount,

            totalRemoved:
                this.totalRemoved,

            confirmedAt:
                this.confirmedAt

        };

    }


    /**
     * JSON 還原
     *
     * 注意：
     * Shoe 應先由 Shoe.fromJSON() 還原。
     * 此方法只恢復 Burn 的狀態，
     * 不會再次從 Shoe 移除指示牌。
     */
    static fromJSON(
        data,
        shoe
    ) {

        if (
            !data ||
            typeof data !==
                "object" ||
            Array.isArray(data)
        ) {

            throw new Error(
                "Burn data is required."
            );

        }

        if (!shoe) {

            throw new Error(
                "Shoe is required."
            );

        }


        const burn =
            new Burn(shoe);


        if (!data.indicator) {

            return burn;

        }


        const indicator =
            Card.fromJSON(
                data.indicator
            );

        const hiddenCount =
            Number.isInteger(
                data.hiddenCount
            )
                ? data.hiddenCount
                : burn.calculate(
                    indicator
                );


        if (
            hiddenCount < 1 ||
            hiddenCount > 10
        ) {

            throw new Error(
                "Invalid hidden burn count."
            );

        }


        burn.indicator =
            indicator;

        burn.hiddenCount =
            hiddenCount;

        burn.state =
            BurnState.CONFIRMED;

        burn.confirmedAt =
            Number.isFinite(
                data.confirmedAt
            )
                ? data.confirmedAt
                : null;


        return burn;

    }

}
