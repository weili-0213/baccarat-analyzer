/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * tests/testRunner.js
 *
 * Browser Test Runner v3
 *
 * 功能：
 *
 * - 執行全部測試
 * - 單獨執行測試
 * - 重跑失敗測試
 * - 顯示執行時間
 * - 顯示 PASS / FAIL
 * - 顯示錯誤訊息
 * - 包含 WorkerAnalyzer 測試
 */

import cardTest
    from "./card.test.js";

import shoeTest
    from "./shoe.test.js";

import burnTest
    from "./burn.test.js";

import dealerTest
    from "./dealer.test.js";

import roundTest
    from "./round.test.js";

import historyTest
    from "./history.test.js";

import gameTest
    from "./game.test.js";

import exactTest
    from "./exact.test.js";

import monteCarloTest
    from "./monteCarlo.test.js";

import analyzerTest
    from "./analyzer.test.js";

import workerAnalyzerTest
    from "./workerAnalyzer.test.js";

import cardInputTest
    from "./cardInput.test.js";

import probabilityTableTest
    from "./probabilityTable.test.js";

import evTableTest
    from "./evTable.test.js";

import recommendationTest
    from "./recommendation.test.js";

import dashboardTest
    from "./dashboard.test.js";

import beadRoadTest
    from "./beadRoad.test.js";

import bigRoadTest
    from "./bigRoad.test.js";

import bigEyeRoadTest
    from "./bigEyeRoad.test.js";

import smallRoadTest
    from "./smallRoad.test.js";

import cockroachRoadTest
    from "./cockroachRoad.test.js";

import roadmapAnalyzerTest
    from "./roadmapAnalyzer.test.js";

import roadmapComponentTest
    from "./roadmapComponent.test.js";


/**
 * 新增測試時：
 *
 * 1. import 測試檔
 * 2. 加入 TESTS 陣列
 */
const TESTS = [

    {
        id:
            "card",

        name:
            "Card",

        run:
            cardTest
    },

    {
        id:
            "shoe",

        name:
            "Shoe",

        run:
            shoeTest
    },

    {
        id:
            "burn",

        name:
            "Burn",

        run:
            burnTest
    },

    {
        id:
            "dealer",

        name:
            "Dealer",

        run:
            dealerTest
    },

    {
        id:
            "round",

        name:
            "Round",

        run:
            roundTest
    },

    {
        id:
            "history",

        name:
            "History",

        run:
            historyTest
    },

    {
        id:
            "game",

        name:
            "Game",

        run:
            gameTest
    },

    {
        id:
            "exact",

        name:
            "Exact",

        run:
            exactTest
    },

    {
        id:
            "monte-carlo",

        name:
            "Monte Carlo",

        run:
            monteCarloTest
    },

    {
        id:
            "analyzer",

        name:
            "Analyzer",

        run:
            analyzerTest
    },

    {
        id:
            "worker-analyzer",

        name:
            "WorkerAnalyzer",

        run:
            workerAnalyzerTest
    },

    {
        id:
            "card-input",

        name:
            "CardInput",

        run:
            cardInputTest
    },

    {
        id:
            "probability-table",

        name:
            "ProbabilityTable",

        run:
            probabilityTableTest
    },

    {
        id:
            "ev-table",

        name:
            "EVTable",

        run:
            evTableTest
    },

    {
        id:
            "recommendation",

        name:
            "Recommendation",

        run:
            recommendationTest
    },

    {
        id:
            "dashboard",

        name:
            "Dashboard",

        run:
            dashboardTest
    },

    {
        id:
            "bead-road",

        name:
            "Bead Road",

        run:
            beadRoadTest
    },

    {
        id:
            "big-road",

        name:
            "Big Road",

        run:
            bigRoadTest
    },

    {
        id:
            "big-eye-road",

        name:
            "Big Eye Road",

        run:
            bigEyeRoadTest
    },

    {
        id:
            "small-road",

        name:
            "Small Road",

        run:
            smallRoadTest
    },

    {
        id:
            "cockroach-road",

        name:
            "Cockroach Road",

        run:
            cockroachRoadTest
    },

    {
        id:
            "roadmap-analyzer",

        name:
            "Roadmap Analyzer",

        run:
            roadmapAnalyzerTest
    },

    {
        id:
            "roadmap-component",

        name:
            "Roadmap Component",

        run:
            roadmapComponentTest
    }

];


const elements = {

    results:
        document.getElementById(
            "results"
        ),

    totalCount:
        document.getElementById(
            "totalCount"
        ),

    passCount:
        document.getElementById(
            "passCount"
        ),

    failCount:
        document.getElementById(
            "failCount"
        ),

    duration:
        document.getElementById(
            "duration"
        ),

    progressText:
        document.getElementById(
            "progressText"
        ),

    progressPercent:
        document.getElementById(
            "progressPercent"
        ),

    progressBar:
        document.getElementById(
            "progressBar"
        ),

    runnerState:
        document.getElementById(
            "runnerState"
        ),

    finalMessage:
        document.getElementById(
            "finalMessage"
        ),

    runAll:
        document.getElementById(
            "runAll"
        ),

    runFailed:
        document.getElementById(
            "runFailed"
        ),

    clear:
        document.getElementById(
            "clear"
        )

};


const state = {

    running:
        false,

    results:
        new Map(),

    startedAt:
        null,

    completedAt:
        null

};


function requireElement(
    element,
    name
) {

    if (!element) {

        throw new Error(
            `Test Runner 缺少 DOM 元素：${name}`
        );

    }

    return element;

}


for (
    const [
        name,
        element
    ] of Object.entries(
        elements
    )
) {

    requireElement(
        element,
        name
    );

}


function formatOutput(output) {

    if (
        output ===
            undefined ||
        output ===
            null
    ) {

        return "測試完成，未回傳詳細資訊。";

    }

    if (
        typeof output ===
            "string"
    ) {

        return output;

    }

    try {

        return JSON.stringify(
            output,
            null,
            2
        );

    }
    catch {

        return String(
            output
        );

    }

}


function formatError(error) {

    if (!error) {

        return "未知錯誤";

    }

    return (
        error.stack ??
        error.message ??
        String(error)
    );

}


function formatDuration(ms) {

    if (
        !Number.isFinite(ms)
    ) {

        return "0 ms";

    }

    if (
        ms < 1000
    ) {

        return `${ms.toFixed(1)} ms`;

    }

    return `${(
        ms /
        1000
    ).toFixed(
        2
    )} s`;

}


function setRunnerState(
    text,
    type = ""
) {

    elements.runnerState
        .textContent =
        text;

    elements.runnerState
        .className =
        `runnerState ${type}`
            .trim();

}


function getFailedTests() {

    return TESTS.filter(
        test =>
            state.results
                .get(
                    test.id
                )
                ?.status ===
                "fail"
    );

}


function setButtonsDisabled(
    disabled
) {

    elements.runAll.disabled =
        disabled;

    elements.clear.disabled =
        disabled;

    elements.runFailed.disabled =

        disabled ||

        getFailedTests()
            .length ===
            0;


    document
        .querySelectorAll(
            ".runSingleButton"
        )
        .forEach(
            button => {

                button.disabled =
                    disabled;

            }
        );

}


function createTestCard(test) {

    const card =
        document.createElement(
            "article"
        );

    card.id =
        `test-${test.id}`;

    card.className =
        "testCard";

    card.innerHTML = `

        <header class="testHeader">

            <div class="testInfo">

                <h2 class="testName"></h2>

                <div class="testMeta">
                    尚未執行
                </div>

            </div>

            <div class="testActions">

                <span class="status waiting">
                    等待
                </span>

                <button
                    type="button"
                    class="runSingleButton"
                >
                    執行
                </button>

            </div>

        </header>

        <pre class="details"></pre>

    `;


    card.querySelector(
        ".testName"
    ).textContent =
        test.name;


    card.querySelector(
        ".runSingleButton"
    ).addEventListener(
        "click",
        async () => {

            if (
                state.running
            ) {

                return;

            }

            state.running =
                true;

            setButtonsDisabled(
                true
            );

            setRunnerState(
                `正在執行 ${test.name}`,
                "running"
            );

            const startedAt =
                performance.now();

            await executeTest(
                test
            );

            const completedAt =
                performance.now();

            elements.duration
                .textContent =
                formatDuration(
                    completedAt -
                    startedAt
                );

            updateSummary();

            updateProgress(
                1,
                1,
                `${test.name} 執行完成`
            );

            finishRunnerState();

            state.running =
                false;

            setButtonsDisabled(
                false
            );

        }
    );


    return card;

}


function renderTestCards() {

    elements.results
        .innerHTML =
        "";

    for (
        const test of
        TESTS
    ) {

        elements.results
            .appendChild(
                createTestCard(
                    test
                )
            );

    }

}


function getTestCard(test) {

    return document
        .getElementById(
            `test-${test.id}`
        );

}


function setTestRunning(
    test,
    card
) {

    card.className =
        "testCard running";

    const status =
        card.querySelector(
            ".status"
        );

    status.className =
        "status running";

    status.textContent =
        "執行中";


    card.querySelector(
        ".testMeta"
    ).textContent =
        "正在執行測試…";


    const details =
        card.querySelector(
            ".details"
        );

    details.textContent =
        "";

    details.classList
        .remove(
            "visible"
        );


    state.results.set(
        test.id,
        {

            status:
                "running",

            durationMs:
                0,

            output:
                null,

            error:
                null

        }
    );

}


function setTestPass(
    test,
    card,
    output,
    durationMs
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
        ".testMeta"
    ).textContent =
        `耗時：${formatDuration(
            durationMs
        )}`;


    const details =
        card.querySelector(
            ".details"
        );

    details.textContent =
        formatOutput(
            output
        );

    details.classList
        .add(
            "visible"
        );


    state.results.set(
        test.id,
        {

            status:
                "pass",

            durationMs,

            output,

            error:
                null

        }
    );

}


function setTestFail(
    test,
    card,
    error,
    durationMs
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
        ".testMeta"
    ).textContent =
        `耗時：${formatDuration(
            durationMs
        )}`;


    const details =
        card.querySelector(
            ".details"
        );

    details.textContent =
        formatError(
            error
        );

    details.classList
        .add(
            "visible"
        );


    state.results.set(
        test.id,
        {

            status:
                "fail",

            durationMs,

            output:
                null,

            error

        }
    );

}


async function executeTest(test) {

    const card =
        getTestCard(
            test
        );

    setTestRunning(
        test,
        card
    );

    const startedAt =
        performance.now();

    try {

        const output =
            await test.run();

        const durationMs =
            performance.now() -
            startedAt;

        setTestPass(
            test,
            card,
            output,
            durationMs
        );

        return true;

    }
    catch (error) {

        const durationMs =
            performance.now() -
            startedAt;

        setTestFail(
            test,
            card,
            error,
            durationMs
        );

        console.error(
            `${test.name} Test Failed`,
            error
        );

        return false;

    }

}


function updateSummary() {

    let passed =
        0;

    let failed =
        0;


    for (
        const result of
        state.results.values()
    ) {

        if (
            result.status ===
                "pass"
        ) {

            passed++;

        }

        if (
            result.status ===
                "fail"
        ) {

            failed++;

        }

    }


    elements.totalCount
        .textContent =
        String(
            TESTS.length
        );

    elements.passCount
        .textContent =
        String(
            passed
        );

    elements.failCount
        .textContent =
        String(
            failed
        );

    elements.runFailed.disabled =

        state.running ||

        failed ===
            0;

}


function updateProgress(
    completed,
    total,
    text
) {

    const ratio =
        total > 0
            ? completed /
                total
            : 0;

    const percent =
        Math.round(
            ratio *
            100
        );


    elements.progressText
        .textContent =
        text;

    elements.progressPercent
        .textContent =
        `${percent}%`;

    elements.progressBar
        .style.width =
        `${percent}%`;

}


function showFinalMessage() {

    const failed =
        getFailedTests()
            .length;

    elements.finalMessage
        .className =

        failed === 0

            ? "finalMessage visible pass"

            : "finalMessage visible fail";


    elements.finalMessage
        .textContent =

        failed === 0

            ? "🎉 全部測試通過"

            : `有 ${failed} 個測試失敗，請查看錯誤內容。`;

}


function finishRunnerState() {

    const failed =
        getFailedTests()
            .length;

    if (
        failed === 0
    ) {

        setRunnerState(
            "全部通過",
            "pass"
        );

    }
    else {

        setRunnerState(
            `${failed} 個失敗`,
            "fail"
        );

    }

    showFinalMessage();

}


async function runTests(tests) {

    if (
        state.running ||
        tests.length ===
            0
    ) {

        return;

    }


    state.running =
        true;

    state.startedAt =
        performance.now();

    state.completedAt =
        null;


    elements.finalMessage
        .className =
        "finalMessage";


    setButtonsDisabled(
        true
    );

    setRunnerState(
        "測試執行中",
        "running"
    );


    let completed =
        0;


    updateProgress(
        0,
        tests.length,
        "準備執行測試"
    );


    for (
        const test of
        tests
    ) {

        updateProgress(
            completed,
            tests.length,
            `正在執行：${test.name}`
        );

        await executeTest(
            test
        );

        completed++;

        updateSummary();

        updateProgress(
            completed,
            tests.length,
            `${test.name} 執行完成`
        );

    }


    state.completedAt =
        performance.now();


    elements.duration
        .textContent =
        formatDuration(
            state.completedAt -
            state.startedAt
        );


    finishRunnerState();

    state.running =
        false;

    setButtonsDisabled(
        false
    );

}


async function runAllTests() {

    state.results.clear();

    renderTestCards();

    updateSummary();

    elements.duration
        .textContent =
        "0 ms";

    await runTests(
        TESTS
    );

}


async function runFailedTests() {

    await runTests(
        getFailedTests()
    );

}


function clearResults() {

    if (
        state.running
    ) {

        return;

    }


    state.results.clear();

    renderTestCards();


    elements.totalCount
        .textContent =
        String(
            TESTS.length
        );

    elements.passCount
        .textContent =
        "0";

    elements.failCount
        .textContent =
        "0";

    elements.duration
        .textContent =
        "0 ms";


    updateProgress(
        0,
        TESTS.length,
        "尚未執行"
    );


    elements.finalMessage
        .className =
        "finalMessage";

    elements.finalMessage
        .textContent =
        "";


    setRunnerState(
        "等待執行"
    );

    elements.runFailed.disabled =
        true;

}


window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "Unhandled Promise Rejection",
            event.reason
        );

    }
);


elements.runAll
    .addEventListener(
        "click",
        runAllTests
    );

elements.runFailed
    .addEventListener(
        "click",
        runFailedTests
    );

elements.clear
    .addEventListener(
        "click",
        clearResults
    );


renderTestCards();

clearResults();


export {
    TESTS,
    runAllTests,
    runFailedTests,
    clearResults
};
