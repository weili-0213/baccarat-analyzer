/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Draw Helper
 *
 * 負責從 Shoe 抽牌並加入 Hand
 *
 */


export function drawTo(hand, shoe){


    if(!hand){

        throw new Error(
            "Hand is required"
        );

    }


    if(!shoe){

        throw new Error(
            "Shoe is required"
        );

    }


    const card = shoe.draw();



    if(!card){

        throw new Error(
            "No cards remaining in shoe"
        );

    }



    hand.add(card);


    return card;

}
