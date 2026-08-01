/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Deck Model
 *
 * 一副標準撲克牌
 *
 * 52 Cards
 *
 * Rank:
 * A,2,3,4,5,6,7,8,9,10,J,Q,K
 *
 * Suit:
 * S,H,D,C
 */


import Card from "./card.js";


const RANKS = [

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


const SUITS = [

    "S",
    "H",
    "D",
    "C"

];


export default class Deck {


    constructor(deckNumber = 1){

    if(
        !Number.isInteger(deckNumber) ||
        deckNumber < 1
    ){
        throw new Error(
            `Invalid deck number: ${deckNumber}`
        );
    }


    this.deckNumber = deckNumber;

    this.cards = [];

    this.create();

} 



    /**
     * 建立52張牌
     */
    create() {

        this.cards = [];


        for(const suit of SUITS){


            for(const rank of RANKS){


                this.cards.push(

                    new Card(
                        rank,
                        suit,
                        this.deckNumber
                    )

                );


            }

        }


    }



    /**
     * 牌數
     */
    get count(){


        return this.cards.length;


    }
    /**
     * 驗證是否完整52張牌
     */
    isValid(){

        return this.cards.length === 52;

    }


    /**
     * 是否包含某張牌
     */
    has(card){


        return this.cards.some(

            item => item.equals(card)

        );


    }



    /**
     * 取得所有牌
     */
    getCards(){


        return [...this.cards];


    }



    /**
     * JSON
     */
    toJSON(){


        return {

            deckNumber:this.deckNumber,

            cards:this.cards

        };


    }



    /**
     * JSON恢復
     */
    static fromJSON(data){


        const deck = new Deck(

            data.deckNumber

        );


        deck.cards = data.cards.map(

            card => Card.fromJSON(card)

        );


        return deck;


    }


}                 // 一副牌

    }

