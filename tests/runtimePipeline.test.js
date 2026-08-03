/**
 * Baccarat Analyzer V5.5
 * tests/runtimePipeline.test.js
 */

import RuntimePipeline, {
    RUNTIME_PIPELINE_VERSION
} from "../runtime/pipeline/RuntimePipeline.js";

import PipelineStage, {
    PIPELINE_STAGE_VERSION,
    PipelineStageStatus
} from "../runtime/pipeline/PipelineStage.js";

import PipelineContext, {
    PIPELINE_CONTEXT_VERSION
} from "../runtime/pipeline/PipelineContext.js";

import PipelineResult, {
    PIPELINE_RESULT_VERSION
} from "../runtime/pipeline/PipelineResult.js";

import PipelineHooks, {
    PIPELINE_HOOKS_VERSION
} from "../runtime/pipeline/PipelineHooks.js";

import PipelineHistory, {
    PIPELINE_HISTORY_VERSION
} from "../runtime/pipeline/PipelineHistory.js";

import {
    RUNTIME_PIPELINE_FACTORY_VERSION
} from "../runtime/createRuntimePipeline.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


export default async function runtimePipelineTest() {
    const messages = [];

    assert(
        RUNTIME_PIPELINE_VERSION ===
            "5.5.0" &&
        PIPELINE_STAGE_VERSION ===
            "5.5.0" &&
        PIPELINE_CONTEXT_VERSION ===
            "5.5.0" &&
        PIPELINE_RESULT_VERSION ===
            "5.5.0" &&
        PIPELINE_HOOKS_VERSION ===
            "5.5.0" &&
        PIPELINE_HISTORY_VERSION ===
            "5.5.0" &&
        RUNTIME_PIPELINE_FACTORY_VERSION ===
            "5.5.0",
        "V5.5 Pipeline 版本錯誤"
    );

    messages.push(
        "✓ V5.5 Pipeline 版本正確"
    );

    let now = 0;

    const hooks =
        new PipelineHooks();

    const history =
        new PipelineHistory({
            limit: 10
        });

    const pipeline =
        new RuntimePipeline({
            clock:
                () => now++,
            hooks,
            history,
            stopOnError:
                true
        });

    assert(
        pipeline.summary
            .stageCount === 0,
        "Pipeline 建立錯誤"
    );

    messages.push(
        "✓ Pipeline 建立正確"
    );

    const executionOrder = [];

    pipeline.register(
        new PipelineStage({
            name: "input",
            priority: 100,
            execute:
                async context => {
                    executionOrder.push(
                        "input"
                    );

                    context.set(
                        "round",
                        {
                            cards: [
                                "AS",
                                "KH",
                                "7D",
                                "2C"
                            ]
                        }
                    );

                    return {
                        context: {
                            inputReady:
                                true
                        }
                    };
                }
        })
    );

    pipeline.register({
        name: "analysis",
        priority: 80,
        execute:
            async context => {
                executionOrder.push(
                    "analysis"
                );

                assert(
                    context.get(
                        "inputReady"
                    ) === true,
                    "Context 未正確傳遞"
                );

                return {
                    context: {
                        analysis: {
                            shouldBet:
                                true
                        }
                    }
                };
            }
    });

    pipeline.register({
        name: "skip-me",
        priority: 70,
        shouldRun:
            () => false,
        execute:
            async () => {
                throw new Error(
                    "不應執行"
                );
            }
    });

    let retryCount = 0;

    pipeline.register({
        name: "retry-stage",
        priority: 60,
        retry: 1,
        execute:
            async () => {
                retryCount++;

                if (retryCount === 1) {
                    throw new Error(
                        "temporary"
                    );
                }

                return {
                    context: {
                        retried:
                            true
                    }
                };
            }
    });

    pipeline.register({
        name: "dashboard",
        priority: 50,
        execute:
            async context => {
                executionOrder.push(
                    "dashboard"
                );

                return {
                    context: {
                        dashboard: {
                            refreshed:
                                true,
                            analysis:
                                context.get(
                                    "analysis"
                                )
                        }
                    }
                };
            }
    });

    assert(
        pipeline.summary
            .stageCount === 5,
        "Stage Register 錯誤"
    );

    messages.push(
        "✓ Stage Register 正確"
    );

    const hookCalls = [];

    hooks.add(
        "beforePipeline",
        () => {
            hookCalls.push(
                "beforePipeline"
            );
        }
    );

    hooks.add(
        "afterPipeline",
        () => {
            hookCalls.push(
                "afterPipeline"
            );
        }
    );

    hooks.add(
        "beforeStage",
        ({ stage }) => {
            hookCalls.push(
                `before:${stage.name}`
            );
        }
    );

    hooks.add(
        "afterStage",
        ({ stage }) => {
            hookCalls.push(
                `after:${stage.name}`
            );
        }
    );

    hooks.add(
        "onSkip",
        ({ stage }) => {
            hookCalls.push(
                `skip:${stage.name}`
            );
        }
    );

    hooks.add(
        "onRetry",
        ({ stage }) => {
            hookCalls.push(
                `retry:${stage.name}`
            );
        }
    );

    const result =
        await pipeline.execute({
            metadata: {
                test:
                    true
            }
        });

    assert(
        result instanceof
            PipelineResult &&
        result.success ===
            true &&
        result.errors.length ===
            1 &&
        result.context.get(
            "retried"
        ) === true &&
        result.context.get(
            "dashboard"
        ).refreshed ===
            true,
        "Pipeline Execute 錯誤"
    );

    messages.push(
        "✓ Pipeline Execute 與 Context 正確"
    );

    assert(
        executionOrder.join(",") ===
            "input,analysis,dashboard",
        "Stage Priority 或順序錯誤"
    );

    assert(
        result.stages.some(
            stage =>
                stage.name ===
                    "skip-me" &&
                stage.status ===
                    PipelineStageStatus.SKIPPED
        ),
        "Skip Stage 錯誤"
    );

    messages.push(
        "✓ Skip Stage 正確"
    );

    assert(
        retryCount === 2 &&
        hookCalls.includes(
            "retry:retry-stage"
        ),
        "Retry Stage 錯誤"
    );

    messages.push(
        "✓ Retry Stage 正確"
    );

    assert(
        hookCalls[0] ===
            "beforePipeline" &&
        hookCalls.includes(
            "afterPipeline"
        ) &&
        hookCalls.includes(
            "skip:skip-me"
        ),
        "Pipeline Hooks 錯誤"
    );

    messages.push(
        "✓ Pipeline Hooks 正確"
    );

    assert(
        history.summary.count ===
            1 &&
        history.latest()
            .success ===
            true,
        "Pipeline History 錯誤"
    );

    messages.push(
        "✓ Pipeline History 正確"
    );

    const abortPipeline =
        new RuntimePipeline({
            clock:
                () => now++
        });

    abortPipeline.register({
        name: "abort",
        priority: 100,
        execute:
            async (
                context,
                { pipeline = null }
            ) => {
                context.set(
                    "abortMarker",
                    true
                );

                return null;
            }
    });

    abortPipeline.register({
        name: "never",
        priority: 10,
        execute:
            async () => {
                throw new Error(
                    "should not run"
                );
            }
    });

    abortPipeline.abort(
        "manual"
    );

    const aborted =
        await abortPipeline.execute();

    assert(
        aborted.aborted ===
            false,
        "Execute 應重設先前 abort 狀態"
    );

    abortPipeline.register({
        name: "abort-inside",
        priority: 200,
        execute:
            async () => {
                abortPipeline.abort(
                    "inside"
                );

                return true;
            }
    });

    const abortedInside =
        await abortPipeline.execute();

    assert(
        abortedInside.aborted ===
            true,
        "Pipeline Abort 錯誤"
    );

    messages.push(
        "✓ Pipeline Abort 正確"
    );

    assert(
        pipeline.summary.version ===
            "5.5.0" &&
        pipeline.summary.executionCount ===
            1 &&
        pipeline.summary.history.count ===
            1,
        "Pipeline Summary 錯誤"
    );

    pipeline.destroy();

    assert(
        pipeline.summary.destroyed ===
            true &&
        pipeline.summary.stageCount ===
            0,
        "Pipeline destroy 錯誤"
    );

    messages.push(
        "✓ Summary 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

Runtime Pipeline V5.5 測試完成

Pipeline：通過
Stage：通過
Context：通過
Hooks：通過
Retry：通過
Skip：通過
Abort：通過
History：通過
Lifecycle：通過
`;
}
