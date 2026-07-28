import { cardSVG } from "./cardSVG.js";

console.log("Baccarat Analyzer Started");

let shoe = [];

document.getElementById("app").innerHTML = `
<div class="container">

<h2>目前牌靴</h2>

<p>剩餘牌數：<span id="cardsLeft">0</span> 張</p>

<hr>

<button id="newShoe">
開始新牌靴
</button>

<button id="draw">
發牌
</button>

<hr>

<h2>結果</h2>

<p id="result">
等待開始...
</p>

</div>
`;

document.getElementById("newShoe").addEventListener("click", newShoe);

function newShoe() {

    shoe = [];

    const suits = ["♠","♥","♦","♣"];
    const ranks = [
        "A","2","3","4","5","6",
        "7","8","9","10","J","Q","K"
    ];

    // 建立 8 副牌
    for(let d=0; d<8; d++){

        for(let suit of suits){

            for(let rank of ranks){

                shoe.push(rank + suit);

            }

        }

    }

    // Fisher-Yates 洗牌
    for(let i = shoe.length - 1; i > 0; i--){

        const j = Math.floor(Math.random() * (i + 1));

        [shoe[i], shoe[j]] = [shoe[j], shoe[i]];

    }

    document.getElementById("cardsLeft").textContent = shoe.length;

    document.getElementById("result").innerHTML =
        "新牌靴建立成功！";
}

document.getElementById("draw").addEventListener("click", drawHand);


function baccaratValue(card){

    const rank = card.slice(0, -1);

    if(rank === "A") return 1;

    if(["10","J","Q","K"].includes(rank))
        return 0;

    return parseInt(rank);

}

function handValue(cards){

    let total = 0;

    for(const card of cards){

        total += baccaratValue(card);

    }

    return total % 10;

}
    
    function drawHand(){

        if(shoe.length < 4){

            document.getElementById("result").innerHTML =
                "牌數不足，請開始新牌靴";

            return;
    }

    // 玩家兩張
    const p1 = shoe.pop();
    const p2 = shoe.pop();

    // 莊家兩張
    const b1 = shoe.pop();
    const b2 = shoe.pop();

    const playerCards = [p1, p2];
    const bankerCards = [b1, b2];

    let playerValue = handValue(playerCards);
    let bankerValue = handValue(bankerCards);

    document.getElementById("cardsLeft").textContent = shoe.length;

    document.getElementById("result").innerHTML = `
    <div class="hand">

        <h3>Player</h3>

        <div class="cards">
            ${playerCards.map(cardSVG).join("")}
        </div>

        <p>點數：${playerValue}</p>

    </div>

    <hr>

    <div class="hand">

        <h3>Banker</h3>

        <div class="cards">
            ${bankerCards.map(cardSVG).join("")}
        </div>

        <p>點數：${bankerValue}</p>

    </div>
    `;
        
}
