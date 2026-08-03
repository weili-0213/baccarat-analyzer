/**
 * Baccarat Analyzer V3.7
 * tests/analyzerCoordinator.test.js
 */

import PipelineManager
    from "../analysis/pipeline/PipelineManager.js";

import AnalyzerCoordinator, {
    ANALYZER_COORDINATOR_VERSION
} from "../analysis/AnalyzerCoordinator.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createShoe() {
    return {
        physicalRemaining: 52,
        observableRemaining: 50,
        unknownBurnedCount: 2,
        summary: {
            physicalRemaining: 52
        },
        peek() {
            return [
                {
                    rank: "A",
                    suit: "S"
                }
            ];
        }
    };
}


export default async function analyzerCoordinatorTest() {
    const messages = [];

    const manager =
        new PipelineManager({
            pipelines: [
                {
                    name: "probability",
                    priority: 10,
                    run({ state }) {
                        return {
                            method:
                                state.runOptions.mode ??
                                "provided",
                            probability: {
                                player: 0.46,
                                banker: 0.45,
                                tie: 0.09
                            }
                        };
                    }
                },
                {
                    name: "result",
                    priority: 70,
                    requires: [
                        "probability"
                    ],
                    run({ state }) {
                        const result = {
                            method:
                                state.method,
                            probability:
                                state.probability,
                            remainingCards:
                                state.remainingCards,
                            physicalRemaining:
                                state.physicalRemaining,
                            observableRemaining:
                                state.observableRemaining,
                            unknownBurnedCount:
                                state.unknownBurnedCount,
                            roundCount:
                                state.roundCount,
                            generatedAfterRound:
                                state.generatedAfterRound,
                            shouldBet:
                                false
                        };

                        return {
                            analysisResult:
                                result,
                            finalResult:
                                result
                        };
                    }
                }
            ]
        });

    const coordinator =
        new AnalyzerCoordinator({
            pipelineManager:
                manager,
            mode:
                "monteCarlo"
        });

    assert(
        ANALYZER_COORDINATOR_VERSION ===
            "3.7.0",
        "AnalyzerCoordinator 版本錯誤"
    );

    assert(
        coordinator instanceof
            AnalyzerCoordinator,
        "AnalyzerCoordinator 建立失敗"
    );

    messages.push(
        "✓ V3.7 建立正確"
    );

    let missingShoeError = null;

    try {
        await coordinator.analyze();
    }
    catch (error) {
        missingShoeError = error;
    }

    assert(
        missingShoeError instanceof Error,
        "沒有 Shoe 時應拒絕分析"
    );

    messages.push(
        "✓ 無 Shoe 驗證正確"
    );

    const shoe =
        createShoe();

    coordinator.setContext({
        shoe,
        roundCount: 7,
        bankroll: 10000,
        recommendationOptions: {
            minimumEV: 0
        }
    });

    const beforeSteps = [];
    const afterSteps = [];

    const result =
        await coordinator.analyze({
            mode: "provided",
            probability: {
                player: 0.46,
                banker: 0.45,
                tie: 0.09
            },
            onBeforeStep({ name }) {
                beforeSteps.push(name);
            },
            onAfterStep({ name }) {
                afterSteps.push(name);
            }
        });

    assert(
        result.method === "provided",
        "runOptions mode 未傳入 Pipeline"
    );

    assert(
        result.probability.player ===
            0.46,
        "分析結果錯誤"
    );

    assert(
        result.remainingCards === 52 &&
        result.observableRemaining === 50 &&
        result.unknownBurnedCount === 2,
        "Shoe state 映射錯誤"
    );

    assert(
        result.generatedAfterRound === 7,
        "generatedAfterRound 錯誤"
    );

    assert(
        beforeSteps.join(",") ===
            "probability,result" &&
        afterSteps.join(",") ===
            "probability,result",
        "Pipeline hooks 錯誤"
    );

    assert(
        Number.isFinite(
            result.durationMs
        ) &&
        typeof result.analyzedAt ===
            "string",
        "分析 metadata 錯誤"
    );

    assert(
        result.pipeline.completed === 2 &&
        result.pipeline.failed === 0,
        "Pipeline metadata 錯誤"
    );

    messages.push(
        "✓ Coordinator 執行流程正確"
    );

    const contextResult =
        await coordinator.analyzeContext(
            {
                shoe,
                roundCount: 8
            },
            {
                mode: "exact"
            }
        );

    assert(
        contextResult.method === "exact" &&
        contextResult.generatedAfterRound === 8,
        "analyzeContext() 錯誤"
    );

    const runResult =
        await coordinator.run(
            {
                shoe,
                roundCount: 9
            },
            {
                mode: "monteCarlo"
            }
        );

    assert(
        runResult.method === "monteCarlo" &&
        runResult.generatedAfterRound === 9,
        "run() 別名錯誤"
    );

    messages.push(
        "✓ analyzeContext() 與 run() 正確"
    );

    coordinator.updateContext({
        roundCount: 10
    });

    assert(
        coordinator.context.roundCount === 10 &&
        coordinator.context.shoe === shoe,
        "updateContext() 錯誤"
    );

    coordinator.setMode("exact");

    assert(
        coordinator.mode === "exact",
        "setMode() 錯誤"
    );

    messages.push(
        "✓ Context 與 Mode 更新正確"
    );

    const summary =
        coordinator.summary;

    assert(
        summary.version === "3.7.0" &&
        summary.runCount === 3 &&
        summary.hasResult === true &&
        summary.pipelineCount === 2,
        "Coordinator summary 錯誤"
    );

    coordinator.clear();

    assert(
        coordinator.lastResult === null &&
        coordinator.lastError === null,
        "clear() 錯誤"
    );

    messages.push(
        "✓ Summary 與 clear() 正確"
    );

    return `
${messages.join("\n")}

Analyzer Coordinator V3.7 測試完成

Context：通過
Initial State：通過
Pipeline Execution：通過
Result Output：通過
Hooks：通過
Metadata：通過
Aliases：通過
Summary：通過
`;
}
