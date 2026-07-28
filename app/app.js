console.log("Baccarat Analyzer Started");

document.getElementById("app").innerHTML = `
    <div class="container">

        <h2>目前牌靴</h2>

        <p>剩餘牌數：312 張</p>

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
