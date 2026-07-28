/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Shoe Model
 *
 * 百家樂牌靴
 *
 * 8 Decks
 *
 * 416 Cards
 */


import Deck from "./deck.js";
import Card from "./card.js";


export default class Shoe {


    constructor(deckCount = 8){


        if(
            !Number.isInteger(deckCount) ||
            deckCount < 1
        ){

            throw new Error(
                `Invalid deck count: ${deckCount}`
            );

        }


        this.deckCount = deckCount;


        this.cards = [];

        this.discarded = [];

        this.burned = [];

        this.create();

        this.shuffle();


    }



    /**
     * 建立牌靴
     */
    create(){

        this.cards=[];


        for(
            let i=1;
            i<=this.deckCount;
            i++
        ){

            const deck=new Deck(i);

            this.cards.push(
                ...deck.getCards()
            );

        }

}
    /**
     * 總牌數
     */
    get total(){

        return this.deckCount * 52;

    }



    /**
     * 剩餘牌數
     */
    get remaining(){


        return this.cards.length;


    }



    /**
     * 已使用牌數
     */
    get used(){


        return this.discarded.length;


    }


    /**
     * 已使用牌列表
     */
    get history(){

        return [
            ...this.discarded
        ];

    }



    /**
     * 剩餘比例
     */
    get remainingRatio(){

        return this.remaining / this.total;

    }


    /**
     * 洗牌
     */
    shuffle(){


        for(
            let i = this.cards.length - 1;
            i > 0;
            i--
        ){

            const j = Math.floor(
                Math.random() * (i + 1)
            );


            [
                this.cards[i],
                this.cards[j]
            ] =
            [
                this.cards[j],
                this.cards[i]
            ];

        }


        return this;


    }



    /**
     * 抽牌
     */
    draw(){


        const card = this.cards.pop();


        if(card){

            this.discarded.push(card);

        }


        return card;


    }



     /**
      * 加入燒牌紀錄
      */
     burn(card){


         if(!card){

             return false;

         }


         this.burned.push(card);

         return true;


    }




    /**
     * 查看剩餘牌
     */
    peek(){


        return [
            ...this.cards
        ];


    }



    /**
     * 加入指定牌到已使用
     */
    remove(card){


        const index =
            this.cards.findIndex(

                item => item.equals(card)

            );


        if(index === -1){

            return false;

        }


        const removed =
            this.cards.splice(
                index,
                1
            )[0];


        this.discarded.push(
            removed
        );


        return true;


    }



    /**
     * 重置牌靴
     */
    reset(){

    this.cards = [];

    this.discarded = [];

    this.burned = [];

    this.create();

    this.shuffle();

    return this;

    }



    /**
     * JSON
     */
    toJSON(){

        return {

            deckCount:this.deckCount,

            cards:this.cards,

            discarded:this.discarded,

            burned:this.burned

        };

    }



    /**
     * 建立牌靴複本
     */
    clone(){

        return Shoe.fromJSON(
            this.toJSON()
        );

    }



    /**
     * JSON還原
     */
    static fromJSON(data){


    const shoe =
        new Shoe(
            data.deckCount
        );


    shoe.cards =
        data.cards.map(
            card => Card.fromJSON(card)
        );


    shoe.discarded =
        data.discarded.map(
            card => Card.fromJSON(card)
        );


    shoe.burned =
        data.burned
        ?
        data.burned.map(
            card => Card.fromJSON(card)
        )
        :
        [];

    return shoe;


    }



}                 # 八副牌
