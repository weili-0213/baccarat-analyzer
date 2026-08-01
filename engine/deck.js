/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Deck Model
 *
 * 一副標準撲克牌
 */

import Card from "./card.js";

const RANKS = Object.freeze([
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

const SUITS = Object.freeze([
    "S",
    "H",
    "D",
    "C"
]);

export default class Deck {

    constructor(deckNumber = 1) {

        if (
            !Number.isInteger(deckNumber) ||
            deckNumber < 1
        ) {
            throw new Error(
                `Invalid deck number: ${deckNumber}`
            );
        }

        this.deckNumber =
            deckNumber;

        this.cards = [];

        this.create();

    }

    /**
     * 建立 52 張牌
     */
    create() {

        this.cards = [];

        for (const suit of SUITS) {

            for (const rank of RANKS) {

                this.cards.push(
                    new Card(
                        rank,
                        suit,
                        this.deckNumber
                    )
                );

            }

        }

        return this;

    }

    /**
     * 牌數
     */
    get count() {

        return this.cards.length;

    }

    /**
     * 是否為完整牌組
     */
    isValid() {

        return (
            this.cards.length === 52
        );

    }

    /**
     * 是否包含某張牌
     */
    has(card) {

        if (!(card instanceof Card)) {
            return false;
        }

        return this.cards.some(
            item =>
                item.equals(card)
        );

    }

    /**
     * 取得所有牌
     */
    getCards() {

        return [
            ...this.cards
        ];

    }

    /**
     * JSON
     */
    toJSON() {

        return {
            deckNumber:
                this.deckNumber,

            cards:
                this.cards.map(
                    card =>
                        card.toJSON()
                )
        };

    }

    /**
     * JSON 還原
     */
    static fromJSON(data) {

        if (!data) {
            throw new Error(
                "Deck data is required."
            );
        }

        if (
            !Array.isArray(data.cards)
        ) {
            throw new Error(
                "Deck cards data is required."
            );
        }

        const deck =
            new Deck(
                data.deckNumber
            );

        deck.cards =
            data.cards.map(
                card =>
                    Card.fromJSON(card)
            );

        return deck;

    }

}
