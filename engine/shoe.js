/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * engine/shoe.js
 *
 * 百家樂牌靴。
 *
 * 支援：
 *
 * - 精確牌面輸入：Rank + Suit + Deck
 * - 花色牌卡輸入：Rank + Suit
 * - 快速點數輸入：只提供 Rank
 * - 點數／花色剩餘數量
 * - 公開牌與未知燒牌的雙剩餘牌模型
 */

import Deck from "./deck.js";
import Card from "./card.js";


export const SHOE_RANKS =
    Object.freeze([

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

    ]);


export const SHOE_SUITS =
    Object.freeze([

        "S",

        "H",

        "D",

        "C"

    ]);


export const SUIT_SYMBOLS =
    Object.freeze({

        S:
            "♠",

        H:
            "♥",

        D:
            "♦",

        C:
            "♣"

    });


function getDeckNumber(card) {

    return (
        card?.deck ??
        card?.deckNumber ??
        null
    );

}


function normalizeRank(value) {

    const rank =
        String(
            value ??
            ""
        )
            .trim()
            .toUpperCase();

    if (
        !SHOE_RANKS.includes(
            rank
        )
    ) {

        throw new Error(
            `Invalid rank: ${value}`
        );

    }

    return rank;

}


function normalizeSuit(
    value,
    {
        optional = false
    } = {}
) {

    if (
        optional &&
        (
            value === undefined ||
            value === null ||
            value === ""
        )
    ) {

        return null;

    }

    const suit =
        String(
            value ??
            ""
        )
            .trim()
            .toUpperCase();

    if (
        !SHOE_SUITS.includes(
            suit
        )
    ) {

        throw new Error(
            `Invalid suit: ${value}`
        );

    }

    return suit;

}


function normalizeDeck(
    value,
    {
        optional = false
    } = {}
) {

    if (
        optional &&
        (
            value === undefined ||
            value === null ||
            value === ""
        )
    ) {

        return null;

    }

    const deck =
        Number(value);

    if (
        !Number.isInteger(deck) ||
        deck < 1
    ) {

        throw new Error(
            `Invalid deck number: ${value}`
        );

    }

    return deck;

}


function samePhysicalCard(
    left,
    right
) {

    if (
        left instanceof Card &&
        typeof left.equals ===
            "function"
    ) {

        return left.equals(
            right
        );

    }

    return (

        left?.rank ===
            right?.rank &&

        left?.suit ===
            right?.suit &&

        getDeckNumber(left) ===
            getDeckNumber(right)

    );

}


export default class Shoe {

    constructor(
        deckCount = 8
    ) {

        if (
            !Number.isInteger(
                deckCount
            ) ||
            deckCount < 1
        ) {

            throw new Error(
                `Invalid deck count: ${deckCount}`
            );

        }

        this.deckCount =
            deckCount;

        this.cards =
            [];

        this.discarded =
            [];

        this.burned =
            [];

        this.unknownBurnedCount =
            0;

        this.create();

        this.shuffle();

    }


    /**
     * 建立完整牌靴。
     */
    create() {

        this.cards =
            [];

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

            this.cards.push(
                ...deck.getCards()
            );

        }

        return this;

    }


    get total() {

        return (
            this.deckCount *
            52
        );

    }


    /**
     * 舊版相容：
     * remaining 代表可觀察牌池。
     */
    get remaining() {

        return this.cards.length;

    }


    get observableRemaining() {

        return this.cards.length;

    }


    /**
     * 未知燒牌沒有具體牌面，
     * 因此只從實體剩餘數扣除。
     */
    get physicalRemaining() {

        return Math.max(

            0,

            this.observableRemaining -
            this.unknownBurnedCount

        );

    }


    get used() {

        return this.discarded.length;

    }


    get history() {

        return [
            ...this.discarded
        ];

    }


    get remainingRatio() {

        if (
            this.total === 0
        ) {

            return 0;

        }

        return (
            this.physicalRemaining /
            this.total
        );

    }


    shuffle(
        random = Math.random
    ) {

        if (
            typeof random !==
                "function"
        ) {

            throw new TypeError(
                "random must be a function"
            );

        }

        for (
            let index =
                this.cards.length -
                1;
            index > 0;
            index--
        ) {

            const target =
                Math.floor(
                    random() *
                    (
                        index +
                        1
                    )
                );

            [
                this.cards[index],
                this.cards[target]
            ] = [
                this.cards[target],
                this.cards[index]
            ];

        }

        return this;

    }


    /**
     * 依牌靴順序抽一張牌。
     */
    draw() {

        const card =
            this.cards.pop();

        if (
            !(card instanceof Card)
        ) {

            return null;

        }

        this.discarded.push(
            card
        );

        return card;

    }


    /**
     * 將指定牌放入 burned。
     *
     * 若牌仍在可觀察牌池，
     * 會先從 cards 移除。
     */
    burn(card) {

        const resolved =
            this.resolveCard(
                card
            );

        const index =
            this.cards.indexOf(
                resolved
            );

        if (
            index >= 0
        ) {

            this.cards.splice(
                index,
                1
            );

        }

        const discardedIndex =
            this.discarded.findIndex(
                item =>
                    samePhysicalCard(
                        item,
                        resolved
                    )
            );

        if (
            discardedIndex >= 0
        ) {

            this.discarded.splice(
                discardedIndex,
                1
            );

        }

        this.burned.push(
            resolved
        );

        return resolved;

    }


    peek() {

        return [
            ...this.cards
        ];

    }


    /**
     * 解析輸入牌面。
     *
     * 支援：
     *
     * resolveCard(Card)
     * resolveCard({ rank, suit, deck })
     * resolveCard({ rank, suit })
     * resolveCard({ rank })
     * resolveCard("A")
     *
     * 只提供 rank 時，會自動選擇牌靴中第一張可用牌。
     * 提供 rank + suit 時，會自動選擇該花色第一張可用牌。
     */
    resolveCard(input) {

        if (
            input instanceof Card
        ) {

            const exact =
                this.cards.find(
                    card =>
                        samePhysicalCard(
                            card,
                            input
                        )
                );

            if (!exact) {

                throw new Error(
                    `Card is not available in shoe: ${input.shortName ?? input.toString()}`
                );

            }

            return exact;

        }


        const data =

            typeof input ===
                "string"

                ? {
                    rank:
                        input
                }

                : input;


        if (
            !data ||
            typeof data !==
                "object" ||
            Array.isArray(data)
        ) {

            throw new TypeError(
                "Card input must be a Card, rank string, or object."
            );

        }


        const rank =
            normalizeRank(
                data.rank
            );

        const suit =
            normalizeSuit(
                data.suit,
                {
                    optional:
                        true
                }
            );

        const deck =
            normalizeDeck(
                data.deck ??
                data.deckNumber,
                {
                    optional:
                        true
                }
            );


        const matched =
            this.cards.find(
                card => {

                    if (
                        card.rank !==
                        rank
                    ) {

                        return false;

                    }

                    if (
                        suit &&
                        card.suit !==
                            suit
                    ) {

                        return false;

                    }

                    if (
                        deck &&
                        getDeckNumber(
                            card
                        ) !== deck
                    ) {

                        return false;

                    }

                    return true;

                }
            );


        if (!matched) {

            const label =
                `${rank}${suit
                    ? SUIT_SYMBOLS[suit]
                    : ""}`;

            throw new Error(
                `Card is not available in shoe: ${label}`
            );

        }


        return matched;

    }


    /**
     * 快速解析點數。
     *
     * suit 可省略，也可由花色卡牌指定。
     */
    resolveByRank(
        rank,
        suit = null
    ) {

        return this.resolveCard({

            rank,

            suit

        });

    }


    /**
     * 移除指定牌，並加入 discarded。
     */
    remove(input) {

        const resolved =
            this.resolveCard(
                input
            );

        const index =
            this.cards.indexOf(
                resolved
            );

        if (
            index < 0
        ) {

            throw new Error(
                "Card is not available in shoe."
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
     * 快速移除指定點數。
     *
     * removeByRank("8")
     * removeByRank("8", "H")
     */
    removeByRank(
        rank,
        suit = null
    ) {

        return this.remove({

            rank,

            suit

        });

    }


    /**
     * 將已移除牌面放回牌靴。
     */
    restore(input) {

        let card =
            input;

        if (
            !(card instanceof Card)
        ) {

            const rank =
                normalizeRank(
                    input?.rank
                );

            const suit =
                normalizeSuit(
                    input?.suit
                );

            const deck =
                normalizeDeck(
                    input?.deck ??
                    input?.deckNumber
                );

            card =
                new Card(
                    rank,
                    suit,
                    deck
                );

        }


        const alreadyAvailable =
            this.cards.some(
                item =>
                    samePhysicalCard(
                        item,
                        card
                    )
            );

        if (
            alreadyAvailable
        ) {

            throw new Error(
                "Card is already available in shoe."
            );

        }


        const discardedIndex =
            this.discarded.findIndex(
                item =>
                    samePhysicalCard(
                        item,
                        card
                    )
            );

        const burnedIndex =
            this.burned.findIndex(
                item =>
                    samePhysicalCard(
                        item,
                        card
                    )
            );


        if (
            discardedIndex < 0 &&
            burnedIndex < 0
        ) {

            throw new Error(
                "Card was not removed from this shoe."
            );

        }


        let restored;

        if (
            discardedIndex >= 0
        ) {

            [
                restored
            ] =
                this.discarded.splice(
                    discardedIndex,
                    1
                );

        }
        else {

            [
                restored
            ] =
                this.burned.splice(
                    burnedIndex,
                    1
                );

        }


        this.cards.push(
            restored
        );

        return restored;

    }


    registerUnknownBurn(count) {

        if (
            !Number.isInteger(
                count
            ) ||
            count < 0
        ) {

            throw new RangeError(
                "Unknown burn count must be a non-negative integer."
            );

        }


        if (
            count >
            this.physicalRemaining
        ) {

            throw new RangeError(
                "Unknown burn count exceeds physical remaining cards."
            );

        }


        this.unknownBurnedCount +=
            count;

        return this.unknownBurnedCount;

    }


    /**
     * 指定點數剩餘數量。
     */
    countByRank(rank) {

        const normalizedRank =
            normalizeRank(
                rank
            );

        return this.cards.reduce(
            (
                count,
                card
            ) =>
                count +
                (
                    card.rank ===
                    normalizedRank
                        ? 1
                        : 0
                ),
            0
        );

    }


    /**
     * 指定點數與花色剩餘數量。
     */
    countByRankAndSuit(
        rank,
        suit
    ) {

        const normalizedRank =
            normalizeRank(
                rank
            );

        const normalizedSuit =
            normalizeSuit(
                suit
            );

        return this.cards.reduce(
            (
                count,
                card
            ) =>
                count +
                (
                    card.rank ===
                        normalizedRank &&
                    card.suit ===
                        normalizedSuit
                        ? 1
                        : 0
                ),
            0
        );

    }


    getRankCounts() {

        return Object.fromEntries(

            SHOE_RANKS.map(
                rank => [

                    rank,

                    this.countByRank(
                        rank
                    )

                ]
            )

        );

    }


    /**
     * 花色卡牌 UI 使用。
     *
     * shoe.getSuitCounts("8")
     *
     * {
     *   S: 8,
     *   H: 8,
     *   D: 7,
     *   C: 8
     * }
     */
    getSuitCounts(rank) {

        const normalizedRank =
            normalizeRank(
                rank
            );

        return Object.fromEntries(

            SHOE_SUITS.map(
                suit => [

                    suit,

                    this.countByRankAndSuit(
                        normalizedRank,
                        suit
                    )

                ]
            )

        );

    }


    hasRank(rank) {

        return (
            this.countByRank(
                rank
            ) > 0
        );

    }


    hasRankAndSuit(
        rank,
        suit
    ) {

        return (
            this.countByRankAndSuit(
                rank,
                suit
            ) > 0
        );

    }


    reset() {

        this.cards =
            [];

        this.discarded =
            [];

        this.burned =
            [];

        this.unknownBurnedCount =
            0;

        this.create();

        this.shuffle();

        return this;

    }


    clone() {

        return Shoe.fromJSON(
            this.toJSON()
        );

    }


    toJSON() {

        return {

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
                this.unknownBurnedCount

        };

    }


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


        const shoe =
            new Shoe(
                data.deckCount
            );


        shoe.cards =
            Array.isArray(
                data.cards
            )
                ? data.cards.map(
                    item =>
                        Card.fromJSON(
                            item
                        )
                )
                : [];


        shoe.discarded =
            Array.isArray(
                data.discarded
            )
                ? data.discarded.map(
                    item =>
                        Card.fromJSON(
                            item
                        )
                )
                : [];


        shoe.burned =
            Array.isArray(
                data.burned
            )
                ? data.burned.map(
                    item =>
                        Card.fromJSON(
                            item
                        )
                )
                : [];


        shoe.unknownBurnedCount =
            Number.isInteger(
                data.unknownBurnedCount
            ) &&
            data.unknownBurnedCount >=
                0

                ? data.unknownBurnedCount

                : 0;


        if (
            shoe.unknownBurnedCount >
            shoe.observableRemaining
        ) {

            throw new RangeError(
                "Invalid unknownBurnedCount in Shoe data."
            );

        }


        return shoe;

    }


    get summary() {

        return {

            deckCount:
                this.deckCount,

            total:
                this.total,

            remaining:
                this.remaining,

            observableRemaining:
                this.observableRemaining,

            physicalRemaining:
                this.physicalRemaining,

            unknownBurnedCount:
                this.unknownBurnedCount,

            used:
                this.used,

            burned:
                this.burned.length,

            remainingRatio:
                this.remainingRatio,

            rankCounts:
                this.getRankCounts()

        };

    }

}
