/**
 * Baccarat Analyzer V5.7
 * tests/runtimeRecovery.test.js
 */

import RuntimeRecovery, {
    RUNTIME_RECOVERY_VERSION,
    RecoveryStatus
} from "../runtime/recovery/RuntimeRecovery.js";

import RecoveryPolicy, {
    RECOVERY_POLICY_VERSION,
    RecoveryAction
} from "../runtime/recovery/RecoveryPolicy.js";

import RecoveryHistory, {
    RECOVERY_HISTORY_VERSION
} from "../runtime/recovery/RecoveryHistory.js";

import {
    RUNTIME_RECOVERY_FACTORY_VERSION
} from "../runtime/createRuntimeRecovery.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


export default async function runtimeRecoveryTest() {
    const messages = [];

    assert(
        RUNTIME_RECOVERY_VERSION ===
            "5.7.0" &&
        RECOVERY_POLICY_VERSION ===
            "5.7.0" &&
        RECOVERY_HISTORY_VERSION ===
            "5.7.0" &&
        RUNTIME_RECOVERY_FACTORY_VERSION ===
            "5.7.0",
        "V5.7 Recovery 版本錯誤"
    );

    messages.push(
        "✓ V5.7 Recovery 版本正確"
    );

    let now = 0;

    const events = [];

    const eventBus = {
        emit(type, payload) {
            events.push({
                type,
                payload
            });
        }
    };

    const metrics = {
        values: {},

        increment(name) {
            this.values[name] =
                (this.values[name] ?? 0) +
                1;
        }
    };

    let rollbackCount = 0;
    let runtimeResetCount = 0;
    let controllerResetCount = 0;
    let schedulerPauseCount = 0;
    let schedulerResumeCount = 0;

    const recovery =
        new RuntimeRecovery({
            eventBus,

            monitor: {
                metrics
            },

            pipeline: {
                async rollback() {
                    rollbackCount++;
                    return [
                        "rolled-back"
                    ];
                }
            },

            runtime: {
                async reset() {
                    runtimeResetCount++;
                    return {
                        status: "ready"
                    };
                }
            },

            controller: {
                async reset() {
                    controllerResetCount++;
                    return {
                        status: "ready"
                    };
                }
            },

            scheduler: {
                pause() {
                    schedulerPauseCount++;
                },

                resume() {
                    schedulerResumeCount++;
                }
            },

            clock:
                () => now++,

            delay:
                async () => {}
        });

    let attempts = 0;

    const retryPolicy =
        new RecoveryPolicy({
            name:
                "retry-policy",

            maxRetries:
                3,

            retryDelay:
                0,

            actions: [
                RecoveryAction.RETRY,
                RecoveryAction.ABORT
            ]
        });

    const retryResult =
        await recovery.recover({
            error:
                new Error(
                    "temporary"
                ),

            policy:
                retryPolicy,

            operation:
                async () => {
                    attempts++;

                    if (attempts < 2) {
                        throw new Error(
                            "retry"
                        );
                    }

                    return "ok";
                }
        });

    assert(
        retryResult.success ===
            true &&
        retryResult.action ===
            RecoveryAction.RETRY &&
        attempts === 2 &&
        recovery.summary.retryCount ===
            2,
        "Retry Recovery 錯誤"
    );

    messages.push(
        "✓ Retry Policy 正確"
    );

    const rollbackPolicy =
        new RecoveryPolicy({
            name:
                "rollback-policy",

            maxRetries:
                0,

            actions: [
                RecoveryAction.ROLLBACK
            ]
        });

    const rollbackResult =
        await recovery.recover({
            error:
                new Error(
                    "pipeline"
                ),

            policy:
                rollbackPolicy,

            context: {
                stage:
                    "analysis"
            }
        });

    assert(
        rollbackResult.success ===
            true &&
        rollbackResult.action ===
            RecoveryAction.ROLLBACK &&
        rollbackCount === 1,
        "Rollback Recovery 錯誤"
    );

    messages.push(
        "✓ Rollback 正確"
    );

    const controllerPolicy =
        new RecoveryPolicy({
            name:
                "controller-policy",

            actions: [
                RecoveryAction.RESTART_CONTROLLER
            ]
        });

    await recovery.recover({
        error:
            new Error(
                "controller"
            ),

        policy:
            controllerPolicy
    });

    assert(
        controllerResetCount ===
            1,
        "Controller Restart 錯誤"
    );

    messages.push(
        "✓ Restart Controller 正確"
    );

    const runtimePolicy =
        new RecoveryPolicy({
            name:
                "runtime-policy",

            actions: [
                RecoveryAction.RESTART_RUNTIME
            ]
        });

    const runtimeResult =
        await recovery.recover({
            error:
                new Error(
                    "runtime"
                ),

        policy:
            runtimePolicy
    });

    assert(
        runtimeResult.success ===
            true &&
        runtimeResetCount ===
            1 &&
        schedulerPauseCount ===
            1 &&
        schedulerResumeCount ===
            1,
        "Runtime Restart 錯誤"
    );

    messages.push(
        "✓ Restart Runtime 正確"
    );

    const failedPolicy =
        new RecoveryPolicy({
            name:
                "failed-policy",

            maxRetries:
                1,

            actions: [
                RecoveryAction.RETRY,
                RecoveryAction.ABORT
            ]
        });

    const failed =
        await recovery.recover({
            error:
                new Error(
                    "permanent"
                ),

            policy:
                failedPolicy,

            operation:
                async () => {
                    throw new Error(
                        "still-failing"
                    );
                }
        });

    assert(
        failed.success ===
            false &&
        failed.status ===
            RecoveryStatus.FAILED &&
        recovery.summary.failureCount ===
            1,
        "Failed Recovery 錯誤"
    );

    messages.push(
        "✓ Recovery Failure 正確"
    );

    assert(
        recovery.history.summary.count ===
            5 &&
        recovery.history.summary
            .successCount ===
            4 &&
        recovery.history.summary
            .failureCount ===
            1 &&
        recovery.history.summary
            .successRate ===
            0.8,
        "Recovery History 錯誤"
    );

    messages.push(
        "✓ Recovery History 正確"
    );

    assert(
        events.length >= 5 &&
        metrics.values
            .recoverySuccess ===
            4 &&
        metrics.values
            .recoveryFailures ===
            1 &&
        metrics.values
            .recoveryRetries ===
            1 &&
        metrics.values
            .recoveryRollbacks ===
            1,
        "Recovery Events 或 Monitor Metrics 錯誤"
    );

    messages.push(
        "✓ Events 與 Monitor Metrics 正確"
    );

    assert(
        recovery.summary.version ===
            "5.7.0" &&
        recovery.summary
            .recoveryCount ===
            5 &&
        recovery.summary
            .successCount ===
            4 &&
        recovery.summary
            .failureCount ===
            1 &&
        recovery.summary
            .restartCount ===
            2,
        "Recovery Summary 錯誤"
    );

    recovery.destroy();

    assert(
        recovery.summary.destroyed ===
            true &&
        recovery.summary.status ===
            RecoveryStatus.DESTROYED &&
        recovery.summary.history.count ===
            0,
        "Recovery destroy 錯誤"
    );

    messages.push(
        "✓ Summary 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

Runtime Recovery V5.7 測試完成

Retry：通過
Rollback：通過
Restart Controller：通過
Restart Runtime：通過
Failure Handling：通過
Recovery History：通過
Events：通過
Monitor Metrics：通過
Lifecycle：通過
`;
}
