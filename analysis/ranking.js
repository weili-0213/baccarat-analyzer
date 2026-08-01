/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Ranking Engine
 *
 * 負責：
 * - 計算綜合分數
 * - 排序
 * - 找最佳下注
 */

const DEFAULT_WEIGHT = Object.freeze({

    ev:0.45,

    kelly:0.25,

    confidence:0.20,

    risk:0.10

});

export default class Ranking{

    constructor(weight={}){

        this.weight={

            ...DEFAULT_WEIGHT,

            ...weight

        };

    }

    /**
     * Score
     */
    score(item){

        return (

            item.ev*this.weight.ev+

            item.kelly*this.weight.kelly+

            item.confidence*this.weight.confidence-

            item.risk*this.weight.risk

        );

    }

    /**
     * 排序
     */
    calculate(data){

        const result=

            Object.entries(data)

            .map(([name,item])=>{

                return{

                    name,

                    ...item,

                    score:

                        this.score(item)

                };

            })

            .sort(

                (a,b)=>

                    b.score-a.score

            );

        result.forEach(

            (item,index)=>{

                item.rank=index+1;

            }

        );

        return result;

    }

    /**
     * 第一名
     */
    best(data){

        return this.calculate(data)[0];

    }

    /**
     * 前N名
     */
    top(data,n=3){

        return this.calculate(data)

            .slice(0,n);

    }

}
