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

import pipelineManagerTest
    from "./pipelineManager.test.js";

import corePipelinesTest
    from "./corePipelines.test.js";

import analysisPipelinesTest
    from "./analysisPipelines.test.js";

import rankingPipelineTest
    from "./rankingPipeline.test.js";

import recommendationPipelineTest
    from "./recommendationPipeline.test.js";

import resultPipelineTest
    from "./resultPipeline.test.js";

import analyzerCoordinatorTest
    from "./analyzerCoordinator.test.js";

import analyzerTest
    from "./analyzer.test.js";

import sessionAnalyzerTest
    from "./sessionAnalyzer.test.js";

import sessionStoreTest
    from "./sessionStore.test.js";

import sessionReportTest
    from "./sessionReport.test.js";

import liveDashboardTest
    from "./liveDashboard.test.js";

import dashboardLayoutTest
    from "./dashboardLayout.test.js";

import casinoRuntimeTest
    from "./casinoRuntime.test.js";

import runtimeAdaptersTest
    from "./runtimeAdapters.test.js";

import runtimeControllersTest
    from "./runtimeControllers.test.js";

import runtimeEventBusTest
    from "./runtimeEventBus.test.js";

import runtimeSchedulerTest
    from "./runtimeScheduler.test.js";

import runtimePipelineTest
    from "./runtimePipeline.test.js";

import runtimeMonitorTest
    from "./runtimeMonitor.test.js";

import runtimeRecoveryTest
    from "./runtimeRecovery.test.js";

import runtimeOrchestratorTest
    from "./runtimeOrchestrator.test.js";

import casinoEngineTest
    from "./casinoEngine.test.js";

import dealerEngineTest
    from "./dealerEngine.test.js";

import roundEngineTest
    from "./roundEngine.test.js";

import shoeManagerTest
    from "./shoeManager.test.js";

import sessionEngineTest
    from "./sessionEngine.test.js";

import sessionStatisticsTest
    from "./sessionStatistics.test.js";

import sessionChartsTest
    from "./sessionCharts.test.js";

import sessionReportPanelTest
    from "./sessionReportPanel.test.js";

import workerAnalyzerTest
    from "./workerAnalyzer.test.js";

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

import cardInputTest
    from "./cardInput.test.js";

import probabilityTableTest
    from "./probabilityTable.test.js";

import evTableTest
    from "./evTable.test.js";

import recommendationTest
    from "./recommendation.test.js";

import recommendationEngineTest 
    from "./recommendationEngine.test.js";

import dashboardTest
    from "./dashboard.test.js";

/**
 * 新增測試時，只需：
 *
 * 1. import 測試檔
 * 2. 加入 TESTS 陣列
 */
const TESTS = [

    {
        id: "card",
        name: "Card",
        run: cardTest
    },

    {
        id: "shoe",
        name: "Shoe",
        run: shoeTest
    },

    {
        id: "burn",
        name: "Burn",
        run: burnTest
    },
    
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
        id: "game",
        name: "Game",
        run: gameTest
    },

    {
        id: "exact",
        name: "Exact",
        run: exactTest
    },

    {
        id: "monte-carlo",
        name: "Monte Carlo",
        run: monteCarloTest
    },

    {
        id: "pipeline-manager",
        name: "Pipeline Manager",
        run: pipelineManagerTest
    },

    {
        id: "core-pipelines",
        name: "Core Pipelines",
        run: corePipelinesTest
    },

    {
        id: "analysis-pipelines",
        name: "Analysis Pipelines",
        run: analysisPipelinesTest
    },

    {
        id: "ranking-pipeline",
        name: "Ranking Pipeline",
        run: rankingPipelineTest
    },

    {
        id: "recommendation-pipeline",
        name: "Recommendation Pipeline",
        run: recommendationPipelineTest
    },

    {
        id: "result-pipeline",
        name: "Result Pipeline",
        run: resultPipelineTest
    },

    {
        id: "analyzer-coordinator",
        name: "Analyzer Coordinator",
        run: analyzerCoordinatorTest
    },

    {
        id: "analyzer",
        name: "Analyzer",
        run: analyzerTest
    },

    {
        id: "session-analyzer",
        name: "Session Analyzer",
        run: sessionAnalyzerTest
    },

    {
        id: "session-store",
        name: "Session Store",
        run: sessionStoreTest
    },

    {
        id: "session-report",
        name: "Session Report",
        run: sessionReportTest
    },

    {
        id: "live-dashboard",
        name: "Dashboard Live Mode",
        run: liveDashboardTest
    },

    {
        id: "dashboard-layout",
        name: "Dashboard Layout Manager",
        run: dashboardLayoutTest
    },

    {
        id: "casino-runtime",
        name: "Casino Runtime",
        run: casinoRuntimeTest
    },

    {
        id: "runtime-adapters",
        name: "Runtime Adapters",
        run: runtimeAdaptersTest
    },

    {
        id: "runtime-controllers",
        name: "Runtime Controllers",
        run: runtimeControllersTest
    },

    {
        id: "runtime-event-bus",
        name: "Runtime EventBus",
        run: runtimeEventBusTest
    },

    {
        id: "runtime-scheduler",
        name: "Runtime Scheduler",
        run: runtimeSchedulerTest
    },

    {
        id: "runtime-pipeline",
        name: "Runtime Pipeline",
        run: runtimePipelineTest
    },

    {
        id: "runtime-monitor",
        name: "Runtime Monitor",
        run: runtimeMonitorTest
    },

    {
        id: "runtime-recovery",
        name: "Runtime Recovery",
        run: runtimeRecoveryTest
    },

    {
        id: "runtime-orchestrator",
        name: "Runtime Orchestrator",
        run: runtimeOrchestratorTest
    },

    {
        id: "casino-engine",
        name: "Casino Engine",
        run: casinoEngineTest
    },

    {
        id: "dealer-engine",
        name: "Dealer Engine",
        run: dealerEngineTest
    },

    {
        id: "round-engine",
        name: "Round Engine",
        run: roundEngineTest
    },

    {
        id: "shoe-manager",
        name: "Shoe Manager",
        run: shoeManagerTest
    },

    {
        id: "session-engine",
        name: "Session Engine",
        run: sessionEngineTest
    },

    {
        id: "session-statistics",
        name: "Dashboard Statistics",
        run: sessionStatisticsTest
    },

    {
        id: "session-charts",
        name: "Dashboard Charts",
        run: sessionChartsTest
    },

    {
        id: "session-report-panel",
        name: "Dashboard Reports",
        run: sessionReportPanelTest
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
        id: "bead-road",
        name: "Bead Road",
        run: beadRoadTest
    },

    {
        id: "big-road",
        name: "Big Road",
        run: bigRoadTest
    },

    {
        id: "big-eye-road",
        name: "Big Eye Road",
        run: bigEyeRoadTest
    },

    {
        id: "small-road",
        name: "Small Road",
        run: smallRoadTest
    },

    {
        id: "cockroach-road",
        name: "Cockroach Road",
        run: cockroachRoadTest
    },

    {
        id: "roadmap-analyzer",
        name: "Roadmap Analyzer",
        run: roadmapAnalyzerTest
    },

    {
        id: "roadmap-component",
        name: "Roadmap Component",
        run: roadmapComponentTest
    },

    {
        id: "card-input",
        name: "Card Input",
        run: cardInputTest
    },

    {
        id: "probability-table",
        name: "Probability Table",
        run: probabilityTableTest
    },

    {
        id: "ev-table",
        name: "EV Table",
        run: evTableTest
    },

    {
        id: "recommendation",
        name: "Recommendation",
        run: recommendationTest
    },

    {
        id: "recommendation-engine",
        name: "Recommendation Engine",
        run: recommendationEngineTest
    },

    {
        id: "dashboard",
        name: "Dashboard",
        run: dashboardTest
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
