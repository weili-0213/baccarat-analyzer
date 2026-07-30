import { cardSVG } from "./cardSVG.js";

console.log("Baccarat Analyzer Started");

// ===== 全域變數 =====
let shoe = [];
let inputCards = [];
let inputStage = "initial";

// ===== 建立畫面 =====
document.getElementById("app").innerHTML = `
<div class="container">

<h2>目前牌靴</h2>

<p>剩餘牌數：<span id="cardsLeft">0</span> 張</p>

<hr>

<button id="newShoe">
開始新牌靴
</button>

<button id="draw">
🎲 測試發牌
</button>

<button id="inputMode">
✍️ 手動輸入
</button>

<hr>

<h2>結果</h2>

<p id="result">
等待開始...
</p>

</div>
`;

document.getElementById("newShoe").addEventListener("click", newShoe);

document.getElementById("draw").addEventListener("click", drawHand);

document.getElementById("inputMode").addEventListener("click", startInputMode);

function newShoe() {

    shoe = [];
    inputCards = [];

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

function bankerNeedDraw(bankerValue, playerThirdValue){

    if(bankerValue <= 2){
        return true;
    }

    if(bankerValue === 3){
        return playerThirdValue !== 8;
    }

    if(bankerValue === 4){
        return playerThirdValue >= 2 &&
               playerThirdValue <= 7;
    }

    if(bankerValue === 5){
        return playerThirdValue >= 4 &&
               playerThirdValue <= 7;
    }

    if(bankerValue === 6){
        return playerThirdValue === 6 ||
               playerThirdValue === 7;
    }

    return false;

}

function playBaccarat(){

    // ===== 初始牌 =====

    const playerCards = [
        shoe.pop(),
        shoe.pop()
    ];

    const bankerCards = [
        shoe.pop(),
        shoe.pop()
    ];

    let playerValue = handValue(playerCards);
    let bankerValue = handValue(bankerCards);

    // ===== Natural =====

    if(playerValue >= 8 || bankerValue >= 8){

        showResult(
            playerCards,
            bankerCards,
            playerValue,
            bankerValue
        );

        return;

    }

    // ===== Player 補牌 =====

    let playerThirdValue = null;

    if(playerValue <= 5){

        const card = shoe.pop();

        playerCards.push(card);

        playerThirdValue = baccaratValue(card);

        playerValue = handValue(playerCards);

    }

    // ===== Banker 補牌 =====

    if(playerThirdValue === null){

        if(bankerValue <= 5){

            bankerCards.push(shoe.pop());

            bankerValue = handValue(bankerCards);

        }

    }
    else{

        if(
            bankerNeedDraw(
                bankerValue,
                playerThirdValue
            )
        ){

            bankerCards.push(shoe.pop());

            bankerValue = handValue(bankerCards);

        }

    }

    showResult(
        playerCards,
        bankerCards,
        playerValue,
        bankerValue
    );

    document.getElementById("cardsLeft").textContent =
        shoe.length;

}

function analyzeShoe(){

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

    for(const card of shoe){

        const rank = card.slice(0,-1);

        count[rank]++;

    }

    const probability = countToProbability(count);

    console.log(probability);

}

function countToProbability(count){

    const total = shoe.length;

    const probability = {};

    for(const rank in count){

        probability[rank] =
            count[rank] / total;

    }

    return probability;

}
    
function drawHand(){

    if(shoe.length < 4){

        document.getElementById("result").innerHTML =
            "牌數不足，請開始新牌靴";

        return;
    }

    playBaccarat();
    
}

function startInputMode(){

    if(shoe.length < 4){

    document.getElementById("result").innerHTML =
        "牌數不足，請開始新牌靴";

    return;

    }

    inputCards = [];
    inputStage = "initial";
    
    document.getElementById("result").innerHTML = `

        <div id="inputArea">

            <h3>請輸入 Player 第一張牌</h3>

            <div id="selectedCard">
                尚未選擇
            </div>

            <div id="rankButtons"></div>

            <div id="suitButtons"></div>

        </div>

    `;

    createInputButtons();
    bindInputButtons();        

}
        
function addInputCard(card){

    const index = shoe.indexOf(card);

    if(index === -1){

        alert("這張牌不存在或已經使用過！");
        return;

    }

    shoe.splice(index,1);

    inputCards.push(card);

    document.getElementById("cardsLeft").textContent = shoe.length;

    analyzeShoe();
    
    const steps = [
        "Player 第一張",
        "Banker 第一張",
        "Player 第二張",
        "Banker 第二張"
    ];

    if(inputCards.length < 4){

    document.getElementById("selectedCard").textContent =
    `已輸入：${inputCards.join(" ")}

    下一張：${steps[inputCards.length]}`;

   }else{

    if(inputStage === "initial"){

    calculateInput();

}
else if(inputStage === "playerThird"){

    calculatePlayerThird();

}
else if(inputStage === "bankerThird"){

    calculateBankerThird();

}

}

}
    
function calculateInput(){

    const playerCards = [
        inputCards[0],
        inputCards[2]
    ];

    const bankerCards = [
        inputCards[1],
        inputCards[3]
    ];

    const playerValue = handValue(playerCards);
    const bankerValue = handValue(bankerCards);

    if(playerValue >= 8 || bankerValue >= 8){

    document.getElementById("result").innerHTML =
        "Natural，不需要補牌";

    return;
    }

    // Player 是否補牌
    if(playerValue <= 5){

        document.getElementById("result").innerHTML = `
            <h3>請輸入 Player 第三張牌</h3>

            <div id="selectedCard">
                尚未選擇
            </div>

            <div id="rankButtons"></div>

            <div id="suitButtons"></div>
        `;

        inputStage = "playerThird";

        createInputButtons();
        bindInputButtons();

        return;

    }

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

    // 不要清
    // inputCards = [];

}

function calculatePlayerThird(){

    // Player 前兩張
    const playerCards = [
        inputCards[0],
        inputCards[2]
    ];

    // Banker 前兩張
    const bankerCards = [
        inputCards[1],
        inputCards[3]
    ];

    // Player 第三張
    playerCards.push(inputCards[4]);

    const playerValue = handValue(playerCards);
    const bankerValue = handValue(bankerCards);

    const playerThirdValue =
        baccaratValue(inputCards[4]);

    const bankerDraw = bankerNeedDraw(
    bankerValue,
    playerThirdValue
    );

    if(bankerDraw){

    document.getElementById("result").innerHTML = `
        <h3>請輸入 Banker 第三張牌</h3>

        <div id="selectedCard">
            尚未選擇
        </div>

        <div id="rankButtons"></div>

        <div id="suitButtons"></div>
    `;

    inputStage = "bankerThird";

    createInputButtons();
    bindInputButtons();

    return;
    }

    showResult(
        playerCards,
        bankerCards,
        playerValue,
        bankerValue
     );

}

function calculateBankerThird(){

    // Player 三張
    const playerCards = [
        inputCards[0],
        inputCards[2],
        inputCards[4]
    ];

    // Banker 三張
    const bankerCards = [
        inputCards[1],
        inputCards[3],
        inputCards[5]
    ];

    const playerValue = handValue(playerCards);
    const bankerValue = handValue(bankerCards);

    showResult(
        playerCards,
        bankerCards,
        playerValue,
        bankerValue
    );

}

function showResult(
    playerCards,
    bankerCards,
    playerValue,
    bankerValue
){

    let winner = "";

    if(playerValue > bankerValue){

        winner = "Player 勝";

    }
    else if(playerValue < bankerValue){

        winner = "Banker 勝";

    }
    else{

        winner = "Tie";

    }

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

        <hr>

        <h2>${winner}</h2>
    `;

}

function createInputButtons(){

    const ranks=[
        "A","2","3","4","5","6",
        "7","8","9","10","J","Q","K"
    ];

    const suits=["♠","♥","♦","♣"];

    const rankDiv=document.getElementById("rankButtons");
    const suitDiv=document.getElementById("suitButtons");

    rankDiv.innerHTML=ranks.map(rank=>`
        <button class="cardBtn rankBtn">${rank}</button>
    `).join("");

    suitDiv.innerHTML=suits.map(suit=>`
        <button class="cardBtn suitBtn">${suit}</button>
    `).join("");

}

function bindInputButtons(){

    let selectedRank = "";

    document.querySelectorAll(".rankBtn").forEach(btn=>{

        btn.onclick = ()=>{

            selectedRank = btn.textContent;

            document.getElementById("selectedCard").textContent =
                "已選：" + selectedRank;

        };

    });

    document.querySelectorAll(".suitBtn").forEach(btn=>{

        btn.onclick = ()=>{

            if(selectedRank==="") return;

            addInputCard(selectedRank + btn.textContent);

            selectedRank="";

        };

    });

}
