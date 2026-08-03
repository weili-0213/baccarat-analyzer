/**
 * Baccarat Analyzer V5.7
 * runtime/recovery/RuntimeRecovery.js
 */

import RecoveryPolicy, {
    RecoveryAction
} from "./RecoveryPolicy.js";

import RecoveryHistory
    from "./RecoveryHistory.js";

import {
    RuntimeEventType
} from "../events/RuntimeEvents.js";


export const RUNTIME_RECOVERY_VERSION = "5.7.0";

export const RecoveryStatus = Object.freeze({
    IDLE: "idle",
    RECOVERING: "recovering",
    RECOVERED: "recovered",
    FAILED: "failed",
    ABORTED: "aborted",
    DESTROYED: "destroyed"
});


export default class RuntimeRecovery {
    constructor({
        runtime = null,
        controller = null,
        pipeline = null,
        scheduler = null,
        eventBus = null,
        monitor = null,
        policy = null,
        history = null,
        clock = () => Date.now(),
        delay = null
    } = {}) {
        if (typeof clock !== "function") {
            throw new TypeError(
                "RuntimeRecovery clock must be a function."
            );
        }

        if (
            eventBus !== null &&
            typeof eventBus.emit !==
                "function"
        ) {
            throw new TypeError(
                "eventBus requires emit()."
            );
        }

        this.runtime = runtime;
        this.controller = controller;
        this.pipeline = pipeline;
        this.scheduler = scheduler;
        this.eventBus = eventBus;
        this.monitor = monitor;
        this.policy =
            policy ??
            new RecoveryPolicy();

        this.history =
            history ??
            new RecoveryHistory();

        this.clock = clock;

        this.delay =
            delay ??
            (
                milliseconds =>
                    new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                milliseconds
                            )
                    )
            );

        this.status =
            RecoveryStatus.IDLE;

        this.recoveryCount = 0;
        this.retryCount = 0;
        this.rollbackCount = 0;
        this.restartCount = 0;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastError = null;
        this.destroyed = false;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "runtime-recovery"
                }
            ) ??
            null;
    }

    async recover({
        error,
        operation = null,
        context = {},
        policy = this.policy
    } = {}) {
        if (this.destroyed) {
            throw new Error(
                "RuntimeRecovery has been destroyed."
            );
        }

        if (!(policy instanceof RecoveryPolicy)) {
            policy =
                new RecoveryPolicy(
                    policy
                );
        }

        const allowed =
            await policy.allows({
                error,
                operation,
                context
            });

        if (!allowed) {
            return this.abort(
                error,
                "policy-rejected"
            );
        }

        this.status =
            RecoveryStatus.RECOVERING;

        this.recoveryCount++;
        this.lastError = error ?? null;

        const startedAt =
            this.clock();

        this.emit(
            RuntimeEventType.WARNING,
            {
                phase:
                    "recovery-start",

                policy:
                    policy.name,

                message:
                    error?.message ??
                    String(error ?? "")
            }
        );

        const attempts = [];

        for (
            let index = 0;
            index < policy.actions.length;
            index++
        ) {
            const action =
                policy.getAction(index);

            try {
                const result =
                    await this.executeAction(
                        action,
                        {
                            error,
                            operation,
                            context,
                            policy,
                            attempts
                        }
                    );

                attempts.push({
                    action,
                    success:
                        true,
                    result
                });

                if (
                    action ===
                        RecoveryAction.IGNORE ||
                    action ===
                        RecoveryAction.RETRY ||
                    action ===
                        RecoveryAction.ROLLBACK ||
                    action ===
                        RecoveryAction.RESTART_CONTROLLER ||
                    action ===
                        RecoveryAction.RESTART_RUNTIME
                ) {
                    const endedAt =
                        this.clock();

                    const record = {
                        success:
                            true,

                        status:
                            RecoveryStatus.RECOVERED,

                        action,

                        startedAt,

                        endedAt,

                        duration:
                            Math.max(
                                0,
                                endedAt - startedAt
                            ),

                        attempts,

                        error:
                            error?.message ??
                            null
                    };

                    this.status =
                        RecoveryStatus.RECOVERED;

                    this.successCount++;

                    this.history.add(
                        record
                    );

                    this.emit(
                        RuntimeEventType.SESSION_UPDATED,
                        {
                            phase:
                                "recovery-success",
                            record
                        }
                    );

                    this.monitor
                        ?.metrics
                        ?.increment(
                            "recoverySuccess"
                        );

                    return record;
                }
            }
            catch (actionError) {
                attempts.push({
                    action,
                    success:
                        false,
                    error:
                        actionError?.message ??
                        String(actionError)
                });

                this.lastError =
                    actionError;
            }
        }

        const endedAt =
            this.clock();

        const failedRecord = {
            success:
                false,

            status:
                RecoveryStatus.FAILED,

            action:
                null,

            startedAt,

            endedAt,

            duration:
                Math.max(
                    0,
                    endedAt - startedAt
                ),

            attempts,

            error:
                this.lastError
                    ?.message ??
                error
                    ?.message ??
                null
        };

        this.status =
            RecoveryStatus.FAILED;

        this.failureCount++;

        this.history.add(
            failedRecord
        );

        this.emit(
            RuntimeEventType.ERROR,
            {
                phase:
                    "recovery-failed",
                record:
                    failedRecord
            }
        );

        this.monitor
            ?.metrics
            ?.increment(
                "recoveryFailures"
            );

        return failedRecord;
    }

    async executeAction(
        action,
        {
            error,
            operation,
            context,
            policy
        } = {}
    ) {
        switch (action) {
            case RecoveryAction.IGNORE:
                return {
                    ignored:
                        true
                };

            case RecoveryAction.RETRY:
                return this.retry(
                    operation,
                    {
                        error,
                        context,
                        policy
                    }
                );

            case RecoveryAction.ROLLBACK:
                return this.rollback(
                    context
                );

            case RecoveryAction.RESTART_CONTROLLER:
                return this.restartController(
                    context
                );

            case RecoveryAction.RESTART_RUNTIME:
                return this.restartRuntime(
                    context
                );

            case RecoveryAction.ABORT:
                throw new Error(
                    "Recovery aborted."
                );

            default:
                throw new Error(
                    `Unsupported recovery action: ${action}`
                );
        }
    }

    async retry(
        operation,
        {
            policy = this.policy
        } = {}
    ) {
        if (typeof operation !== "function") {
            throw new TypeError(
                "Retry requires an operation function."
            );
        }

        let lastError = null;

        for (
            let attempt = 1;
            attempt <=
                policy.maxRetries;
            attempt++
        ) {
            this.retryCount++;

            if (policy.retryDelay > 0) {
                await this.delay(
                    policy.retryDelay
                );
            }

            try {
                const result =
                    await operation({
                        attempt,
                        recovery:
                            this
                    });

                this.monitor
                    ?.metrics
                    ?.increment(
                        "recoveryRetries"
                    );

                return {
                    attempt,
                    result
                };
            }
            catch (error) {
                lastError = error;
            }
        }

        throw (
            lastError ??
            new Error(
                "Recovery retry failed."
            )
        );
    }

    async rollback(context = {}) {
        if (
            !this.pipeline ||
            typeof this.pipeline.rollback !==
                "function"
        ) {
            throw new Error(
                "Pipeline rollback is unavailable."
            );
        }

        this.rollbackCount++;

        const result =
            await this.pipeline.rollback(
                context
            );

        this.monitor
            ?.metrics
            ?.increment(
                "recoveryRollbacks"
            );

        return result;
    }

    async restartController(options = {}) {
        if (
            !this.controller ||
            typeof this.controller.reset !==
                "function"
        ) {
            throw new Error(
                "Controller restart is unavailable."
            );
        }

        this.restartCount++;

        return this.controller.reset(
            options
        );
    }

    async restartRuntime(options = {}) {
        if (
            !this.runtime ||
            typeof this.runtime.reset !==
                "function"
        ) {
            throw new Error(
                "Runtime restart is unavailable."
            );
        }

        this.restartCount++;

        this.scheduler
            ?.pause
            ?.();

        try {
            const result =
                await this.runtime.reset(
                    options
                );

            return result;
        }
        finally {
            this.scheduler
                ?.resume
                ?.();
        }
    }

    abort(error = null, reason = "aborted") {
        const timestamp =
            this.clock();

        const record = {
            success:
                false,

            status:
                RecoveryStatus.ABORTED,

            action:
                RecoveryAction.ABORT,

            startedAt:
                timestamp,

            endedAt:
                timestamp,

            duration:
                0,

            attempts:
                [],

            reason,

            error:
                error?.message ??
                null
        };

        this.status =
            RecoveryStatus.ABORTED;

        this.history.add(record);

        return record;
    }

    reset() {
        this.status =
            RecoveryStatus.IDLE;

        this.lastError = null;

        return this;
    }

    destroy() {
        this.reset();
        this.history.clear();
        this.destroyed = true;
        this.status =
            RecoveryStatus.DESTROYED;

        return this;
    }

    get summary() {
        return {
            version:
                RUNTIME_RECOVERY_VERSION,

            status:
                this.status,

            destroyed:
                this.destroyed,

            recoveryCount:
                this.recoveryCount,

            retryCount:
                this.retryCount,

            rollbackCount:
                this.rollbackCount,

            restartCount:
                this.restartCount,

            successCount:
                this.successCount,

            failureCount:
                this.failureCount,

            lastError:
                this.lastError
                    ?.message ??
                null,

            history:
                this.history.summary,

            policy:
                this.policy.summary
        };
    }
}
