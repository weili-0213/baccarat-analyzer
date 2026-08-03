/**
 * Baccarat Analyzer V5.7
 * runtime/recovery/RecoveryPolicy.js
 */

export const RECOVERY_POLICY_VERSION = "5.7.0";

export const RecoveryAction = Object.freeze({
    IGNORE: "ignore",
    RETRY: "retry",
    ROLLBACK: "rollback",
    RESTART_CONTROLLER: "restart-controller",
    RESTART_RUNTIME: "restart-runtime",
    ABORT: "abort"
});

export default class RecoveryPolicy {
    constructor({
        name = "default",
        maxRetries = 2,
        retryDelay = 0,
        actions = [
            RecoveryAction.RETRY,
            RecoveryAction.ROLLBACK,
            RecoveryAction.RESTART_RUNTIME,
            RecoveryAction.ABORT
        ],
        shouldRecover = null
    } = {}) {
        if (
            typeof name !== "string" ||
            name.length === 0
        ) {
            throw new TypeError(
                "RecoveryPolicy requires a name."
            );
        }

        if (
            !Number.isInteger(maxRetries) ||
            maxRetries < 0
        ) {
            throw new RangeError(
                "maxRetries must be zero or greater."
            );
        }

        if (
            !Number.isFinite(retryDelay) ||
            retryDelay < 0
        ) {
            throw new RangeError(
                "retryDelay must be zero or greater."
            );
        }

        if (!Array.isArray(actions)) {
            throw new TypeError(
                "actions must be an array."
            );
        }

        for (const action of actions) {
            if (
                !Object.values(RecoveryAction)
                    .includes(action)
            ) {
                throw new Error(
                    `Unknown recovery action: ${action}`
                );
            }
        }

        this.name = name;
        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;
        this.actions = [...actions];
        this.shouldRecover = shouldRecover;
    }

    async allows(context = {}) {
        if (
            typeof this.shouldRecover ===
                "function"
        ) {
            return Boolean(
                await this.shouldRecover(
                    context
                )
            );
        }

        return true;
    }

    getAction(index) {
        return (
            this.actions[index] ??
            RecoveryAction.ABORT
        );
    }

    get summary() {
        return {
            version:
                RECOVERY_POLICY_VERSION,

            name:
                this.name,

            maxRetries:
                this.maxRetries,

            retryDelay:
                this.retryDelay,

            actions:
                [...this.actions]
        };
    }
}
