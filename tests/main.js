/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Browser Test Runner v2
 *
 * 功能：
 * - 執行全部測試
 * - 單獨執行測試
 * - 重跑失敗測試
 * - 顯示執行時間
 * - 顯示 PASS / FAIL
 * - 顯示錯誤訊息
 */

import dealerTest
    from "./dealer.test.js";

import roundTest
    from "./round.test.js";

import historyTest
    from "./history.test.js";

import beadRoadTest
    from "./beadRoad.test.js";


/**
 * 新增測試時，只需：
 *
 * 1. import 測試檔
 * 2. 加入 TESTS 陣列
 */
const TESTS = [

    {
        id: "dealer",
        name: "Dealer",
        run: dealerTest
    },

    {
        id: "round",
        name: "Round",
        run: roundTest
    },

    {
        id: "history",
        name: "History",
        run: historyTest
    },

    {
        id: "bead-road",
        name: "Bead Road",
        run: beadRoadTest
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

    running: false,

    results: new Map(),

    startedAt: null,

    completedAt: null

};


/**
 * 將任意輸出轉成可顯示文字
 */
function formatOutput(output) {

    if (
        output === undefined ||
        output === null
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

        return String(output);

    }

}


/**
 * 錯誤轉成文字
 */
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


/**
 * 毫秒格式
 */
function formatDuration(ms) {

    if (
        !Number.isFinite(ms)
    ) {

        return "0 ms";

    }

    if (ms < 1000) {

        return `${ms.toFixed(1)} ms`;

    }

    return `${(ms / 1000).toFixed(2)} s`;

}


/**
 * 更新 Runner 狀態
 */
function setRunnerState(
    text,
    type = ""
) {

    elements.runnerState
        .textContent =
        text;

    elements.runnerState
        .className =
        `runnerState ${type}`.trim();

}


/**
 * 鎖定或解鎖按鈕
 */
function setButtonsDisabled(
    disabled
) {

    elements.runAll.disabled =
        disabled;

    elements.clear.disabled =
        disabled;

    const failedCount =
        getFailedTests().length;

    elements.runFailed.disabled =
        disabled ||
        failedCount === 0;

    document
        .querySelectorAll(
            ".runSingleButton"
        )
        .forEach(button => {

            button.disabled =
                disabled;

        });

}


/**
 * 取得失敗測試
 */
function getFailedTests() {

    return TESTS.filter(test => {

        return (
            state.results
                .get(test.id)
                ?.status === "fail"
        );

    });

}


/**
 * 建立初始測試卡片
 */
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

            if (state.running) {
                return;
            }

            state.running = true;

            setButtonsDisabled(true);

            setRunnerState(
                `正在執行 ${test.name}`,
                "running"
            );

            const startedAt =
                performance.now();

            await executeTest(test);

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

            state.running = false;

            setButtonsDisabled(false);

        }
    );

    return card;

}


/**
 * 建立所有測試卡片
 */
function renderTestCards() {

    elements.results.innerHTML =
        "";

    for (const test of TESTS) {

        elements.results.appendChild(
            createTestCard(test)
        );

    }

}


/**
 * 取得測試卡片
 */
function getTestCard(test) {

    return document.getElementById(
        `test-${test.id}`
    );

}


/**
 * 設為執行中
 */
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

    details.classList.remove(
        "visible"
    );

    state.results.set(
        test.id,
        {
            status: "running",
            durationMs: 0,
            output: null,
            error: null
        }
    );

}


/**
 * 設為通過
 */
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
        `耗時：${formatDuration(durationMs)}`;

    const details =
        card.querySelector(
            ".details"
        );

    details.textContent =
        formatOutput(output);

    details.classList.add(
        "visible"
    );

    state.results.set(
        test.id,
        {
            status: "pass",
            durationMs,
            output,
            error: null
        }
    );

}


/**
 * 設為失敗
 */
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
        `耗時：${formatDuration(durationMs)}`;

    const details =
        card.querySelector(
            ".details"
        );

    details.textContent =
        formatError(error);

    details.classList.add(
        "visible"
    );

    state.results.set(
        test.id,
        {
            status: "fail",
            durationMs,
            output: null,
            error
        }
    );

}


/**
 * 執行單一測試
 */
async function executeTest(test) {

    const card =
        getTestCard(test);

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


/**
 * 更新摘要
 */
function updateSummary() {

    let passed = 0;
    let failed = 0;

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
        String(TESTS.length);

    elements.passCount
        .textContent =
        String(passed);

    elements.failCount
        .textContent =
        String(failed);

    elements.runFailed.disabled =
        state.running ||
        failed === 0;

}


/**
 * 更新進度
 */
function updateProgress(
    completed,
    total,
    text
) {

    const ratio =
        total > 0
            ? completed / total
            : 0;

    const percent =
        Math.round(
            ratio * 100
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


/**
 * 顯示最後結果
 */
function showFinalMessage() {

    const failed =
        getFailedTests().length;

    elements.finalMessage
        .className =
        failed === 0
            ? "finalMessage visible pass"
            : "finalMessage visible fail";

    if (failed === 0) {

        elements.finalMessage
            .textContent =
            "🎉 全部測試通過";

    }
    else {

        elements.finalMessage
            .textContent =
            `有 ${failed} 個測試失敗，請查看錯誤內容。`;

    }

}


/**
 * 完成 Runner 狀態
 */
function finishRunnerState() {

    const failed =
        getFailedTests().length;

    if (failed === 0) {

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


/**
 * 執行指定測試集合
 */
async function runTests(
    tests
) {

    if (
        state.running ||
        tests.length === 0
    ) {

        return;

    }

    state.running = true;

    state.startedAt =
        performance.now();

    state.completedAt =
        null;

    elements.finalMessage
        .className =
        "finalMessage";

    setButtonsDisabled(true);

    setRunnerState(
        "測試執行中",
        "running"
    );

    let completed = 0;

    updateProgress(
        0,
        tests.length,
        "準備執行測試"
    );

    for (const test of tests) {

        updateProgress(
            completed,
            tests.length,
            `正在執行：${test.name}`
        );

        await executeTest(test);

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

    state.running = false;

    setButtonsDisabled(false);

}


/**
 * 執行全部測試
 */
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


/**
 * 重跑失敗測試
 */
async function runFailedTests() {

    const failedTests =
        getFailedTests();

    await runTests(
        failedTests
    );

}


/**
 * 清除結果
 */
function clearResults() {

    if (state.running) {
        return;
    }

    state.results.clear();

    renderTestCards();

    elements.totalCount
        .textContent =
        String(TESTS.length);

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


/**
 * 全域載入錯誤
 */
window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "Unhandled Promise Rejection",
            event.reason
        );

    }
);


/**
 * 綁定按鈕
 */
elements.runAll.addEventListener(
    "click",
    runAllTests
);

elements.runFailed.addEventListener(
    "click",
    runFailedTests
);

elements.clear.addEventListener(
    "click",
    clearResults
);


/**
 * 初始化
 */
renderTestCards();

clearResults();
