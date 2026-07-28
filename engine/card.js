/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Card Model
 *
 * 一張實體牌
 *
 * rank :
 * A,2,3,4,5,6,7,8,9,10,J,Q,K
 *
 * suit :
 * S,H,D,C
 *
 * deck :
 * 第幾副牌 (>=1)
 */

const VALID_RANKS = [
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

const VALID_SUITS = [
    "S",
    "H",
    "D",
    "C"
];

export default class Card {

    constructor(rank, suit, deck = 1) {

        if (!VALID_RANKS.includes(rank)) {
            throw new Error(`Invalid rank : ${rank}`);
        }

        if (!VALID_SUITS.includes(suit)) {
            throw new Error(`Invalid suit : ${suit}`);
        }

        if (!Number.isInteger(deck) || deck < 1) {
    throw new Error(`Invalid deck : ${deck}`);
    }

        this.rank = rank;
        this.suit = suit;
        this.deck = deck;

        Object.freeze(this);
    }

    /**
     * 百家樂牌值
     */
    get baccaratValue() {

        switch (this.rank) {

            case "A":
                return 1;

            case "10":
            case "J":
            case "Q":
            case "K":
                return 0;

            default:
                return Number(this.rank);
        }

    }

    /**
     * Pair 比較值
     */
    get pairValue() {
        return this.rank;
    }

    /**
     * 是否圖片牌
     */
    get isFaceCard() {

        return [
            "10",
            "J",
            "Q",
            "K"
        ].includes(this.rank);

    }

    /**
     * 是否 Ace
     */
    get isAce() {
        return this.rank === "A";
    }

    /**
     * 是否紅色
     */
    get isRed() {

        return (
            this.suit === "H" ||
            this.suit === "D"
        );

    }

/**
 * 是否黑色
 */
get isBlack() {

    return (
        this.suit === "S" ||
        this.suit === "C"
    );
}
/**
 * 顏色
 */
get color() {

    if (this.isRed) {
        return "red";
    }

    if (this.isBlack) {
        return "black";
    }

    return null;

}
/**
 * 花色符號
 */
get suitSymbol() {

    switch (this.suit) {

        case "S":
            return "♠";

        case "H":
            return "♥";

        case "D":
            return "♦";

        case "C":
            return "♣";

        default:
            return "";
    }

}
/**
 * 簡短名稱
 */
get shortName() {

    return `${this.rank}${this.suit}`;

}
/**
 * 唯一ID
 */
get id() {

    return `${this.deck}-${this.suit}-${this.rank}`;

}
    /**
     * 是否同一張牌
     */
    equals(card) {

    if (!(card instanceof Card)) {
        return false;
    }

    return this.id === card.id;

    }

    /**
     * 顯示文字
     */
    toString() {

        return `${this.rank}${this.suitSymbol}`;

    }

    /**
     * JSON
     */
    toJSON() {

        return {

            rank: this.rank,
            suit: this.suit,
            deck: this.deck

        };

    }

    /**
     * JSON還原
     */
    static fromJSON(data) {


        if(!data){
            throw new Error("Card data required");
        }


        return new Card(
            data.rank,
            data.suit,
            data.deck
        );

    }

    /**
     * 建立複製
     */
    clone() {

        return new Card(
            this.rank,
            this.suit,
            this.deck
        );

    }

}// Baccarat Card Engine
