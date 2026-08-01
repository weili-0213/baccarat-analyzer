/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Browser Test Runner
 */

import dealerTest
    from "./dealer.test.js";


const TESTS = [

    {
        name: "Dealer",
        run: dealerTest
    }

];


const resultArea =
    document.getElementById(
        "results"
    );

const totalCount =
    document.getElementById(
        "totalCount"
    );

const passCount =
    document.getElementById(
        "passCount"
    );

const failCount =
    document.getElementById(
        "failCount"
    );

const runAllButton =
    document.getElementById(
        "runAll"
    );

const clearButton =
    document.getElementById(
        "clear"
    );


function resetSummary() {

    totalCount.textContent =
        String(TESTS.length);

    passCount.textContent =
        "0";

    failCount.textContent =
        "0";

}


function clearResults() {

    resultArea.innerHTML =
        "";

    resetSummary();

}


function createTestCard(name) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "testCard running";

    card.innerHTML = `

        <div class="testHeader">

            <h2 class="testName">
                ${name}
            </h2>

            <span class="status running">
                執行中
            </span>

        </div>

        <div class="details"></div>

    `;

    resultArea.appendChild(
        card
    );

    return card;

}


function setPass(
    card,
    details = ""
) {

    card.className =
        "testCard pass";

    const status =
        card.querySelector(
            ".status"
        );

    status.className =
        "status pass";

    status.textContent =
        "✅ PASS";

    card.querySelector(
        ".details"
    ).textContent =
        details;

}


function setFail(
    card,
    error
) {

    card.className =
        "testCard fail";

    const status =
        card.querySelector(
            ".status"
        );

    status.className =
        "status fail";

    status.textContent =
        "❌ FAIL";

    card.querySelector(
        ".details"
    ).textContent =

        error?.stack ??

        error?.message ??

        String(error);

}


async function runAllTests() {

    clearResults();

    runAllButton.disabled =
        true;

    let passed = 0;
    let failed = 0;

    for (const test of TESTS) {

        const card =
            createTestCard(
                test.name
            );

        try {

            const output =
                await test.run();

            passed++;

            setPass(

                card,

                typeof output ===
                "string"

                    ? output

                    : "測試完成，未發現錯誤。"

            );

        }
        catch (error) {

            failed++;

            setFail(
                card,
                error
            );

            console.error(
                `${test.name} Test Failed`,
                error
            );

        }

        passCount.textContent =
            String(passed);

        failCount.textContent =
            String(failed);

    }

    runAllButton.disabled =
        false;

}


runAllButton.addEventListener(

    "click",

    runAllTests

);


clearButton.addEventListener(

    "click",

    clearResults

);


resetSummary();
