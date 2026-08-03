/**
 * Baccarat Analyzer V3.5
 * tests/pipelineManager.test.js
 */

import PipelineManager, {
    PIPELINE_MANAGER_VERSION
} from "../analysis/pipeline/PipelineManager.js";

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function assertRejects(callback, message) {
    try {
        await callback();
    }
    catch (error) {
        return error;
    }

    throw new Error(message);
}

export default async function pipelineManagerTest() {
    const messages = [];
    const order = [];
    const manager = new PipelineManager();

    manager.register({
        name: "probability",
        priority: 10,
        run({ state }) {
            order.push("probability");
            return {
                probability: {
                    player: state.player,
                    banker: state.banker,
                    tie: state.tie
                }
            };
        }
    });

    manager.register({
        name: "ev",
        priority: 20,
        requires: ["probability"],
        run({ state }) {
            order.push("ev");
            return {
                ev: {
                    player:
                        state.probability.player - 0.5
                }
            };
        }
    });

    manager.register({
        name: "recommendation",
        priority: 30,
        requires: ["ev"],
        run({ state }) {
            order.push("recommendation");
            return {
                recommendation: {
                    shouldBet:
                        state.ev.player > 0
                }
            };
        }
    });

    assert(
        PIPELINE_MANAGER_VERSION === "3.5.0",
        "PipelineManager 版本錯誤"
    );

    assert(manager.size === 3, "註冊數量錯誤");
    messages.push("✓ V3.5 版本與註冊正確");

    const before = [];
    const after = [];

    const result = await manager.run(
        {
            player: 0.52,
            banker: 0.39,
            tie: 0.09
        },
        {
            onBeforeStep({ name }) {
                before.push(name);
            },
            onAfterStep({ name }) {
                after.push(name);
            }
        }
    );

    assert(
        order.join(",") ===
            "probability,ev,recommendation",
        "Pipeline 執行順序錯誤"
    );

    assert(
        before.join(",") === order.join(",") &&
        after.join(",") === order.join(","),
        "Hook 執行順序錯誤"
    );

    assert(
        result.state.recommendation.shouldBet === true,
        "共享 state 更新錯誤"
    );

    assert(
        result.completed === 3 &&
        result.failed === 0,
        "執行統計錯誤"
    );

    messages.push("✓ Priority、共享 state 與 Hooks 正確");

    manager.disable("ev");

    const dependencyError = await assertRejects(
        () => manager.run({
            player: 0.52,
            banker: 0.39,
            tie: 0.09
        }),
        "缺少 dependency 時應失敗"
    );

    assert(
        dependencyError.message.includes("requires state.ev"),
        "Dependency 錯誤訊息不正確"
    );

    messages.push("✓ Enable／Disable 與 Dependency 驗證正確");

    manager.enable("ev");

    const controller = new AbortController();
    controller.abort();

    const abortError = await assertRejects(
        () => manager.run({}, {
            signal: controller.signal
        }),
        "AbortSignal 應中止 Pipeline"
    );

    assert(
        abortError.name === "AbortError",
        "AbortError 類型錯誤"
    );

    messages.push("✓ AbortSignal 正確");

    const stepResult = await manager.runStep(
        "probability",
        {
            player: 0.45,
            banker: 0.46,
            tie: 0.09
        }
    );

    assert(
        stepResult.execution.length === 1 &&
        stepResult.state.probability.banker === 0.46,
        "runStep() 錯誤"
    );

    messages.push("✓ runStep() 正確");

    const continueManager = new PipelineManager({
        stopOnError: false
    });

    continueManager.register({
        name: "broken",
        run() {
            throw new Error("expected failure");
        }
    });

    continueManager.register({
        name: "next",
        run() {
            return {
                continued: true
            };
        }
    });

    const continued = await continueManager.run();

    assert(
        continued.failed === 1 &&
        continued.completed === 1 &&
        continued.state.continued === true,
        "stopOnError=false 未繼續執行"
    );

    messages.push("✓ Error recovery 模式正確");

    const summary = manager.summary;

    assert(
        summary.version === "3.5.0" &&
        summary.size === 3 &&
        summary.runCount >= 1,
        "summary 錯誤"
    );

    messages.push("✓ summary 正確");

    return `
${messages.join("\n")}

PipelineManager V3.5 測試完成

Priority：通過
Shared State：通過
Dependencies：通過
Hooks：通過
Abort：通過
runStep：通過
Error Recovery：通過
`;
}
