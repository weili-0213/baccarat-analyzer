/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Burn Model
 *
 * 百家樂燒牌
 *
 * 開靴第一張牌決定燒牌數
 */


export default class Burn {


    constructor(shoe){


    if(!shoe){

        throw new Error(
            "Shoe is required"
        );

    }


    this.shoe = shoe;


    // 是否已完成燒牌
    this.executed = false;


    // 燒牌指示牌
    this.indicator = null;


    // 燒牌數量
    this.amount = 0;


    // 隱藏燒牌
    this.hiddenBurnCards = [];


    }  


    /**
     * 計算燒牌數
     *
     * A = 1
     * 2-9 = 點數
     * 10,J,Q,K = 10
     */
    calculate(card){


        if(!card){

            throw new Error(
                "Card required"
            );

        }


        if(card.rank === "A"){

            return 1;

        }


        if(
            [
                "10",
                "J",
                "Q",
                "K"
            ].includes(card.rank)
        ){

            return 10;

        }


        return Number(card.rank);


    }



    /**
     * 執行燒牌
     */
    execute(){


    if(this.executed){

        throw new Error(
            "Burn already executed"
        );

    }


    this.indicator =
        this.shoe.draw();



    if(!this.indicator){

        throw new Error(
            "No burn indicator"
        );

    }



    // 計算燒牌數
    this.amount =
        this.calculate(
            this.indicator
        );



    // 實際燒牌，不公開
    for(
        let i = 0;
        i < this.amount;
        i++
    ){

        const card =
            this.shoe.draw();


        if(card){

            this.hiddenBurnCards.push(card);

            this.shoe.burn(card);

        }

    }


    this.executed = true;


    return {

        indicator:this.indicator,

        amount:this.amount

    };


    }



    /**
     * 是否完成燒牌
     */
    get isExecuted(){

        return this.executed;

    }



    /**
     * 燒牌數量
     */
    get count(){

        return this.hiddenBurnCards.length;

    }



    /**
     * 公開資訊
     */
    get info(){

        return {

            indicator:this.indicator,

            amount:this.amount

        };

    }



    /**
     * JSON
     */
    toJSON(){

        return {

            indicator:this.indicator,

            amount:this.amount

        };

    }
}
