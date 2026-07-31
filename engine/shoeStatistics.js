// src/engine/shoeStatistics.js

import Card from "./card.js";

export default class ShoeStatistics {

    constructor(shoe) {

        if (!shoe) {
            throw new Error("Shoe required");
        }

        this.shoe = shoe;

    }

    /**
     * 剩餘牌數
     */
    get remainingCards() {

        return this.shoe.remaining;

    }

    /**
     * 已使用牌數
     */
    get usedCards() {

        return this.shoe.used;

    }

    /**
     * 剩餘比例
     */
    get remainingRatio() {

        return this.shoe.remainingRatio;

    }

    /**
     * Rank統計
     */
    get rankCount() {

        const count = {

            A:0,
            2:0,
            3:0,
            4:0,
            5:0,
            6:0,
            7:0,
            8:0,
            9:0,
            10:0,
            J:0,
            Q:0,
            K:0

        };

        for(const card of this.shoe.cards){

            count[card.rank]++;

        }

        return count;

    }

    /**
     * Suit統計
     */
    get suitCount(){

        const count={

            S:0,
            H:0,
            D:0,
            C:0

        };

        for(const card of this.shoe.cards){

            count[card.suit]++;

        }

        return count;

    }

    /**
     * Baccarat點數統計
     *
     * 0~9
     */
    get valueCount(){

        const count={

            0:0,
            1:0,
            2:0,
            3:0,
            4:0,
            5:0,
            6:0,
            7:0,
            8:0,
            9:0

        };

        for(const card of this.shoe.cards){

            count[card.baccaratValue]++;

        }

        return count;

    }

    /**
     * 高牌
     *
     * 9 10 J Q K
     */
    get highCards(){

        const rank=this.rankCount;

        return (

            rank["9"]+

            rank["10"]+

            rank["J"]+

            rank["Q"]+

            rank["K"]

        );

    }

    /**
     * 低牌
     *
     * A~5
     */
    get lowCards(){

        const rank=this.rankCount;

        return (

            rank["A"]+

            rank["2"]+

            rank["3"]+

            rank["4"]+

            rank["5"]

        );

    }

    /**
     * 高牌比例
     */
    get highRatio(){

        return this.highCards / this.remainingCards;

    }

    /**
     * 低牌比例
     */
    get lowRatio(){

        return this.lowCards / this.remainingCards;

    }

    /**
     * 指定Rank剩餘
     */
    getRankCount(rank){

        return this.rankCount[rank] || 0;

    }

    /**
     * 指定牌剩餘
     */
    getCardCount(rank,suit){

        return this.shoe.cards.filter(card=>

            card.rank===rank &&
            card.suit===suit

        ).length;

    }

    /**
     * Rank機率
     */
    getRankProbability(rank){

        return this.getRankCount(rank)/this.remainingCards;

    }

    /**
     * Card機率
     */
    getCardProbability(rank,suit){

        return this.getCardCount(rank,suit)/this.remainingCards;

    }

}
