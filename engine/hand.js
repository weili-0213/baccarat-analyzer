/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Hand Model
 *
 * 百家樂手牌
 *
 */


import Card from "./card.js";


export default class Hand {


    constructor(cards = []){


        this.cards = [];


        for(const card of cards){

            this.add(card);

        }


    }



    /**
     * 加入牌
     */
    add(card){


        if(!(card instanceof Card)){

            throw new Error(
                "Invalid card"
            );

        }


        this.cards.push(card);


        return this;

    }



    /**
     * 取得手牌
     *
     * 回傳副本，避免外部修改
     */
    getCards(){

        return [
            ...this.cards
        ];

    }



    /**
     * 顯示手牌
     *
     * 例如：
     * A♠ 8♥
     */
    toString(){

        return this.cards
            .map(card => card.toString())
            .join(" ");

    }



    /**
     * 移除牌
     */
    remove(card){

        const index =
            this.cards.findIndex(
                item => item.equals(card)
            );


        if(index === -1){

            return false;

        }


        this.cards.splice(
            index,
            1
        );


        return true;

    }



    /**
     * 是否包含牌
     */
    hasCard(card){

        return this.cards.some(
            item => item.equals(card)
        );

    }



    /**
     * 手牌張數
     */
    get count(){

        return this.cards.length;

    }



    /**
     * 最後一張牌
     */
    get lastCard(){

        return this.cards[
            this.cards.length - 1
        ] || null;

    }



    /**
     * 百家樂點數
     *
     * 只取個位數
     */
    import { baccaratScore } from "./score.js";

    get value() {

        return baccaratScore(this.cards);

    }



    /**
     * 是否天牌
     *
     * Natural 8 / 9
     */

    import {
        baccaratScore,
        isNatural
    } from "./score.js";

    get isNatural() {

        return isNatural(this.cards);

    }



    /**
     * 是否 Pair
     *
     * 百家樂對子
     * 只看前兩張
     */
    get isPair(){

        if(this.cards.length !== 2){

            return false;

        }


        return (
            this.cards[0].pairValue
            ===
            this.cards[1].pairValue
        );

    }


    /**
     * 清空手牌
     */
    clear(){


        this.cards = [];

        return this;

    }



    /**
     * 複製手牌
     */
    clone(){

        return new Hand(
            this.cards.map(
                card=>card.clone()
            )
        );

    }



    /**
     * JSON
     */
    toJSON(){


        return {

            cards:this.cards.map(
                card=>card.toJSON()
            )

        };

    }



    /**
     * JSON還原
     */
    static fromJSON(data){

        return new Hand(
            data.cards.map(
                card=>Card.fromJSON(card)
            )
        );

    }



}
