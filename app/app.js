import { cardSVG } from "./cardSVG.js";

console.log("Baccarat Analyzer Started");

// ===== 全域變數 =====
let shoe = [];
const PAYOUT = {

    player: 1,

    banker: 0.95,

    tie: 8

};
let inputCards = [];
let inputStage = "initial";
let inputStep = 0;

document.getElementById("newShoe").addEventListener("click", newShoe);

document.getElementById("draw").addEventListener("click", drawHand);

document.getElementById("inputMode").addEventListener("click", startInputMode);

function newShoe() {

    shoe = [];
    inputCards = [];
    inputStage="initial";

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

    const simShoe = [...shoe];

    // ===== 初始牌 =====

   const playerCards = [
       simShoe.pop(),
      simShoe.pop()
   ];
    const bankerCards = [
        simShoe.pop(),
        simShoe.pop()
    ];

    let playerValue = handValue(playerCards);
    let bankerValue = handValue(bankerCards);

    // ===== Natural =====

    if(
        (playerCards.length === 2 && playerValue >= 8) ||
        (bankerCards.length === 2 && bankerValue >= 8)
    ){

        showResult(
            playerCards,
            bankerCards,
            playerValue,
            bankerValue
        );

        analyzeShoe();

        document.getElementById("cardsLeft").textContent =
            shoe.length;

        return;
    }

    // ===== Player 補牌 =====

    let playerThirdValue = null;

    if(playerValue <= 5){

        const card = simShoe.pop();

        playerCards.push(card);

        playerThirdValue = baccaratValue(card);

        playerValue = handValue(playerCards);

    }

    // ===== Banker 補牌 =====

    if(playerThirdValue === null){

        if(bankerValue <= 5){

            bankerCards.push(simShoe.pop());

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

           bankerCards.push(simShoe.pop());

            bankerValue = handValue(bankerCards);

        }

    }

    shoe = simShoe;

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

    const nextRound = estimateNextRound();

    const totalCards = shoe.length;

    const highCards =
    count["9"]+
    count["10"]+
    count["J"]+
    count["Q"]+
    count["K"];

    const lowCards =
    count["A"]+
    count["2"]+
    count["3"]+
    count["4"]+
    count["5"];

    const playerEV =
        calculateEV(nextRound.player, PAYOUT.player);

    const bankerEV =
        calculateEV(nextRound.banker, PAYOUT.banker);

    const tieEV =
        calculateEV(nextRound.tie, PAYOUT.tie);

    const bestBet = getBestBet(
        playerEV,
        bankerEV,
        tieEV
    );

    document.getElementById("prediction").innerHTML = `
    <h3>下一局預測</h3>

    <hr>

    <h3>牌靴資訊</h3>

    <p>
    高牌(9~K):
    ${((highCards/totalCards)*100).toFixed(2)}%
    </p>

    <p>
    低牌(A~5):
    ${((lowCards/totalCards)*100).toFixed(2)}%
    </p>

    <p>
    Player：
    ${(nextRound.player*100).toFixed(2)}%

    EV：
    ${(playerEV*100).toFixed(2)}%
    </p>

    <p>
    Banker：
    ${(nextRound.banker*100).toFixed(2)}%

    EV：
    ${(bankerEV*100).toFixed(2)}%
    </p>

    <p>
    Tie：
    ${(nextRound.tie*100).toFixed(2)}%

    EV：
    ${(tieEV*100).toFixed(2)}%
    </p>

    <hr>

    <h3>
    最佳下注：
    ${bestBet.name}
    </h3>

    <p>
    EV：
    ${(bestBet.ev * 100).toFixed(2)}%
    </p>
    `;

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

function estimateNextRound(){

    let playerWin = 0;
    let bankerWin = 0;
    let tie = 0;

    const simulations = 5000;

    for(let i = 0; i < simulations; i++){

        // ===== 複製剩餘牌靴 =====
        const simShoe = [...shoe];

        // ===== 洗牌 =====
        for(let j = simShoe.length - 1; j > 0; j--){

            const k = Math.floor(Math.random() * (j + 1));

            [simShoe[j], simShoe[k]] = [simShoe[k], simShoe[j]];

        }

        // ===== 初始牌 =====
        const playerCards = [
            simShoe.pop(),
            simShoe.pop()
        ];

        const bankerCards = [
            simShoe.pop(),
            simShoe.pop()
        ];

        // ===== 計算點數 =====
        let playerValue = handValue(playerCards);
        let bankerValue = handValue(bankerCards);

        // ===== Natural 以外才補牌 =====
        if(playerValue < 8 && bankerValue < 8){

            // ===== Player 補牌 =====
            let playerThirdValue = null;

            if(playerValue <= 5){

                const card = simShoe.pop();

                playerCards.push(card);

                playerThirdValue = baccaratValue(card);

                playerValue = handValue(playerCards);

            }

            // ===== Banker 補牌 =====
            if(playerThirdValue === null){

                if(bankerValue <= 5){

                    bankerCards.push(simShoe.pop());

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

                    bankerCards.push(simShoe.pop());

                    bankerValue = handValue(bankerCards);

                }

            }

        }

        // ===== 統計勝負 =====
        if(playerValue > bankerValue){

            playerWin++;

        }
        else if(playerValue < bankerValue){

            bankerWin++;

        }
        else{

            tie++;

        }

    }

    // ===== 回傳機率 =====
    return {

        player: playerWin / simulations,
        banker: bankerWin / simulations,
        tie: tie / simulations

    };

}

function calculateEV(probability, payout){

    return probability * payout - (1 - probability);

}

function getBestBet(playerEV, bankerEV, tieEV){

    let best = {
        name: "Player",
        ev: playerEV
    };

    if(bankerEV > best.ev){

        best = {
            name: "Banker",
            ev: bankerEV
        };

    }

    if(tieEV > best.ev){

        best = {
            name: "Tie",
            ev: tieEV
        };

    }

    return best;

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

    inputStep = 0;


    document.getElementById("result").innerHTML = `

    <div id="inputArea">

    <h3>目前牌局</h3>


    <div class="hand">

    <h3>Player</h3>

    <div id="playerCards" class="cards">
    尚未輸入
    </div>

    </div>


    <hr>


    <div class="hand">

    <h3>Banker</h3>

    <div id="bankerCards" class="cards">
    尚未輸入
    </div>

    </div>


    <hr>

    <h3 id="gameStatus">
    等待輸入
    </h3>

    <p id="nextStep">
    請輸入 Player 第一張牌
    </p>
    
    <h3 id="inputTitle">
    請輸入 Player 第一張牌
    </h3>


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

function resetInputRound(){

    inputCards = [];

    inputStage = "initial";

    inputStep = 0;


    document.getElementById("result").innerHTML = `

    <div id="inputArea">

    <h3>目前牌局</h3>


    <div class="hand">

    <h3>Player</h3>

    <div id="playerCards" class="cards">
    尚未輸入
    </div>

    </div>


    <hr>


    <div class="hand">

    <h3>Banker</h3>

    <div id="bankerCards" class="cards">
    尚未輸入
    </div>

    </div>


    <hr>

    <h3 id="gameStatus">
    等待輸入
    </h3>

    <p id="nextStep">
    請輸入 Player 第一張牌
    </p>

    <h3 id="inputTitle">
    請輸入 Player 第一張牌
    </h3>


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


    // 從牌靴移除
    shoe.splice(index,1);


    // 加入輸入牌
    inputCards.push(card);


    inputStep++;


    updateInputTitle();


    document.getElementById("cardsLeft").textContent =
        shoe.length;


    updateInputDisplay();


    // ===== 判斷目前輸入階段 =====

    if(inputStage === "initial"){


        if(inputCards.length === 4){

            calculateInput();

        }


    }

    else if(inputStage === "playerThird"){


        if(inputCards.length === 5){

            calculatePlayerThird();

        }


    }

    else if(inputStage === "bankerThird"){


        if(inputCards.length === 6){

            calculateBankerThird();

        }

    }

}

function updateInputDisplay(){

    const playerArea =
        document.getElementById("playerCards");

    const bankerArea =
        document.getElementById("bankerCards");


    if(!playerArea || !bankerArea)
        return;


    const playerCards=[];

    const bankerCards=[];


    if(inputCards[0])
        playerCards.push(inputCards[0]);

    if(inputCards[2])
        playerCards.push(inputCards[2]);

    if(inputCards[4])
        playerCards.push(inputCards[4]);


    if(inputCards[1])
        bankerCards.push(inputCards[1]);

    if(inputCards[3])
        bankerCards.push(inputCards[3]);

    if(inputCards[5])
        bankerCards.push(inputCards[5]);


    playerArea.innerHTML =
        playerCards.length
        ?
        playerCards.map(cardSVG).join("")
        :
        "尚未輸入";


    bankerArea.innerHTML =
        bankerCards.length
        ?
        bankerCards.map(cardSVG).join("")
        :
        "尚未輸入";

}

function updateInputTitle(){

    const title =
        document.getElementById("inputTitle");


    if(!title)
        return;


    const steps = [

        "Player 第一張",

        "Banker 第一張",

        "Player 第二張",

        "Banker 第二張",

        "Player 第三張",

        "Banker 第三張"

    ];


    if(inputStep < steps.length){

        title.textContent =
            "請輸入 " + steps[inputStep] + "牌";

    }

}

function updatePlayer(cards, point) {

    document.getElementById("playerCards").innerHTML =
        cards.map(cardSVG).join("");

    document.getElementById("playerPoint").textContent =
        `點數：${point}`;

}

function updateBanker(cards, point) {

    document.getElementById("bankerCards").innerHTML =
        cards.map(cardSVG).join("");

    document.getElementById("bankerPoint").textContent =
        `點數：${point}`;

}

function updateStatus(text) {

    document.getElementById("gameStatus").textContent = text;

}

function updateNext(text) {

    document.getElementById("nextStep").textContent = text;

}

function updatePrediction(html) {

    document.getElementById("predictionContent").innerHTML = html;

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


    let playerValue = handValue(playerCards);
    let bankerValue = handValue(bankerCards);


    // ===== Natural =====

    if(
        playerValue >= 8 ||
        bankerValue >= 8
    ){

        updatePlayer(playerCards, playerValue);

        updateBanker(bankerCards, bankerValue);

        updateStatus(
            playerValue >= 8 ? 
            "Player Natural" :
            "Banker Natural"
        );

        updateNext("本局完成");

        analyzeShoe();

        return;

    }


    // ===== Player 補牌 =====

    if(playerValue <= 5){

        inputStage = "playerThird";

        inputStep = 4;

        updateInputTitle();

        updatePlayer(playerCards, playerValue);
        updateBanker(bankerCards, bankerValue);

        updateStatus("Player 補牌");

        updateNext("請輸入 Player 第三張");

        createInputButtons();
        bindInputButtons();

        return;
    }



    // ===== Banker 補牌 =====

    if(bankerValue <= 5){

        inputStage = "bankerThird";

        inputStep = 5;

        updateInputTitle();

        updatePlayer(playerCards, playerValue);
        updateBanker(bankerCards, bankerValue);

        updateStatus("Banker 補牌");

        updateNext("請輸入 Banker 第三張");

        createInputButtons();
        bindInputButtons();

        return;
    }



    updatePlayer(playerCards, playerValue);

    updateBanker(bankerCards, bankerValue);

    updateStatus("開牌完成");

    updateNext("開始下一局");

    analyzeShoe();

}

function calculatePlayerThird(){

    // 更新輸入牌面
    updateInputDisplay();

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

    // 重新計算點數
    const playerValue = handValue(playerCards);
    const bankerValue = handValue(bankerCards);

    // Player 第三張點數
    const playerThirdValue =
        baccaratValue(inputCards[4]);

    // Banker 是否需要補牌
    const bankerDraw = bankerNeedDraw(
        bankerValue,
        playerThirdValue
    );

    // ===== Banker 要補牌 =====
   if(bankerDraw){

        inputStage = "bankerThird";

        inputStep = 5;

        updateInputTitle();


        updatePlayer(
            playerCards,
            playerValue
        );


        updateBanker(
            bankerCards,
            bankerValue
        );


        updateStatus("Banker 補牌");

        updateNext("請輸入 Banker 第三張");


        createInputButtons();
        bindInputButtons();

        return;

    }

    // ===== Banker 不補牌 =====

    showResult(
        playerCards,
        bankerCards,
        playerValue,
        bankerValue
    );

    analyzeShoe();

}

function calculateBankerThird(){

     // 更新輸入牌面顯示
    updateInputDisplay();

    // Player 三張
    const playerCards=[
        inputCards[0],
        inputCards[2]
    ];

    if(inputCards[4]){
        playerCards.push(inputCards[4]);
    }

    // Banker 三張
    const bankerCards=[
        inputCards[1],
        inputCards[3]
    ];

    if(inputCards[5]){
        bankerCards.push(inputCards[5]);
    }

    const playerValue = handValue(playerCards);
    const bankerValue = handValue(bankerCards);

    showResult(
        playerCards,
        bankerCards,
        playerValue,
        bankerValue
    );

    analyzeShoe();

}

function showResult(
    playerCards,
    bankerCards,
    playerValue,
    bankerValue
){

    let winner = "";

    // ===== Natural 判斷 =====
    let natural = "";

    if(
        (playerCards.length === 2 && playerValue >= 8) ||
        (bankerCards.length === 2 && bankerValue >= 8)
    ){

        natural = "<h3>🎉 Natural</h3>";

    }

    // ===== 勝負判斷 =====
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

        ${natural}

        <h2>${winner}</h2>

        <button id="nextRound">
        下一局
        </button>
    `;

    document.getElementById("nextRound")
        .onclick = resetInputRound;

}

function cardAvailable(card){

    return shoe.includes(card);

}

function createInputButtons(){

    const ranks=[
        "A","2","3","4","5","6",
        "7","8","9","10","J","Q","K"
    ];

    const suits=[
        "♠","♥","♦","♣"
    ];


    const rankDiv=document.getElementById("rankButtons");
    const suitDiv=document.getElementById("suitButtons");


    rankDiv.innerHTML=ranks.map(rank=>`

        <button class="cardBtn rankBtn">
            ${rank}
        </button>

    `).join("");


    suitDiv.innerHTML=suits.map(suit=>`

        <button class="cardBtn suitBtn">
            ${suit}
        </button>

    `).join("");


}

function bindInputButtons(){

    let selectedRank = "";


    document.querySelectorAll(".rankBtn")
    .forEach(btn=>{

        btn.onclick = ()=>{

            selectedRank = btn.textContent.trim();


            document.getElementById("selectedCard")
            .textContent =
            "已選：" + selectedRank;


        };


    });



    document.querySelectorAll(".suitBtn")
    .forEach(btn=>{


        btn.onclick = ()=>{


            if(selectedRank==="")
                return;


            const card =
                selectedRank +
                btn.textContent.trim();



            if(!cardAvailable(card)){


                alert(
                card+" 已使用或不存在"
                );


                return;

            }



            addInputCard(card);


            selectedRank="";


        };


    });


}
