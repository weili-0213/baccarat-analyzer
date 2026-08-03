/**
 * Baccarat Analyzer V5.3
 * runtime/controllers/RuntimeController.js
 *
 * High-level command controller with Runtime EventBus integration.
 */

import {
    RuntimeEventType
} from "../events/RuntimeEvents.js";


export const RUNTIME_CONTROLLER_VERSION = "5.3.0";

export const RuntimeCommand = Object.freeze({
    START: "start",
    NEW_SHOE: "new-shoe",
    START_ROUND: "start-round",
    COMPLETE_ROUND: "complete-round",
    ANALYZE: "analyze",
    ADD_BET: "add-bet",
    REFRESH: "refresh",
    PAUSE: "pause",
    RESUME: "resume",
    TOGGLE_PAUSE: "toggle-pause",
    STOP: "stop",
    RESET: "reset"
});


function requireMethod(
    target,
    method,
    name
) {
    if (
        !target ||
        typeof target[method] !==
            "function"
    ) {
        throw new TypeError(
            `${name} requires ${method}().`
        );
    }

    return target;
}


export default class RuntimeController {
    constructor({
        runtime,
        roundController = null,
        eventBus = null,
        onStateChange = null,
        onError = null
    } = {}) {
        this.runtime =
            requireMethod(
                runtime,
                "start",
                "runtime"
            );

        requireMethod(
            runtime,
            "startRound",
            "runtime"
        );

        requireMethod(
            runtime,
            "completeRound",
            "runtime"
        );

        requireMethod(
            runtime,
            "stop",
            "runtime"
        );

        if (
            eventBus !== null &&
            typeof eventBus.emit !==
                "function"
        ) {
            throw new TypeError(
                "eventBus requires emit()."
            );
        }

        this.roundController =
            roundController;

        this.eventBus =
            eventBus;

        this.onStateChange =
            onStateChange;

        this.onError =
            onError;

        this.busy =
            false;

        this.lastCommand =
            null;

        this.lastResult =
            null;

        this.lastError =
            null;

        this.commandCount =
            0;
    }

    emit(
        type,
        payload = null
    ) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "runtime-controller"
                }
            ) ??
            null;
    }

    async execute(
        command,
        payload = {}
    ) {
        if (
            !Object.values(RuntimeCommand)
                .includes(command)
        ) {
            throw new Error(
                `Unknown runtime command: ${command}`
            );
        }

        if (this.busy) {
            throw new Error(
                "RuntimeController is busy."
            );
        }

        this.busy =
            true;

        this.lastCommand =
            command;

        this.lastError =
            null;

        this.emit(
            RuntimeEventType.COMMAND_STARTED,
            {
                command,
                payload
            }
        );

        this.notifyState();

        try {
            let result;

            switch (command) {
                case RuntimeCommand.START:
                    result =
                        await this.start(
                            payload
                        );
                    break;

                case RuntimeCommand.NEW_SHOE:
                    result =
                        await this.newShoe(
                            payload
                        );
                    break;

                case RuntimeCommand.START_ROUND:
                    result =
                        await this.startRound(
                            payload
                        );
                    break;

                case RuntimeCommand.COMPLETE_ROUND:
                    result =
                        await this.completeRound(
                            payload
                        );
                    break;

                case RuntimeCommand.ANALYZE:
                    result =
                        await this.analyze(
                            payload
                        );
                    break;

                case RuntimeCommand.ADD_BET:
                    result =
                        await this.addBet(
                            payload
                        );
                    break;

                case RuntimeCommand.REFRESH:
                    result =
                        await this.refresh(
                            payload
                        );
                    break;

                case RuntimeCommand.PAUSE:
                    result =
                        this.pause();
                    break;

                case RuntimeCommand.RESUME:
                    result =
                        this.resume();
                    break;

                case RuntimeCommand.TOGGLE_PAUSE:
                    result =
                        this.togglePause();
                    break;

                case RuntimeCommand.STOP:
                    result =
                        await this.stop(
                            payload
                        );
                    break;

                case RuntimeCommand.RESET:
                    result =
                        await this.reset(
                            payload
                        );
                    break;
            }

            this.lastResult =
                result;

            this.commandCount++;

            this.emit(
                RuntimeEventType.COMMAND_COMPLETED,
                {
                    command,
                    result
                }
            );

            return result;
        }
        catch (error) {
            this.lastError =
                error;

            this.emit(
                RuntimeEventType.ERROR,
                {
                    command,
                    message:
                        error?.message ??
                        String(error)
                }
            );

            this.onError?.(
                error,
                {
                    command,
                    payload
                }
            );

            throw error;
        }
        finally {
            this.busy =
                false;

            this.notifyState();
        }
    }

    async start(options = {}) {
        const result =
            await this.runtime
                .start(options);

        this.emit(
            RuntimeEventType.RUNTIME_STARTED,
            result
        );

        return result;
    }

    async newShoe(options = {}) {
        let result;

        if (
            typeof this.runtime.reset ===
                "function"
        ) {
            result =
                await this.runtime
                    .reset(options);
        }
        else {
            await this.runtime.stop();

            result =
                await this.runtime
                    .start(options);
        }

        this.roundController
            ?.reset
            ?.();

        this.emit(
            RuntimeEventType.SHOE_CHANGED,
            {
                options,
                result
            }
        );

        return result;
    }

    async startRound(input = {}) {
        const result =
            await this.runtime
                .startRound(input);

        this.emit(
            RuntimeEventType.ROUND_STARTED,
            {
                input,
                result
            }
        );

        return result;
    }

    async completeRound(input = {}) {
        const payload =
            this.roundController &&
            typeof this.roundController
                .buildCompletionPayload ===
                "function"
                ? this.roundController
                    .buildCompletionPayload(
                        input
                    )
                : input;

        const result =
            await this.runtime
                .completeRound(
                    payload
                );

        this.roundController
            ?.complete
            ?.(
                result
            );

        this.emit(
            RuntimeEventType.ROUND_COMPLETED,
            {
                payload,
                result
            }
        );

        return result;
    }

    async analyze(options = {}) {
        requireMethod(
            this.runtime,
            "analyze",
            "runtime"
        );

        this.emit(
            RuntimeEventType.ANALYSIS_STARTED,
            {
                options
            }
        );

        const result =
            await this.runtime
                .analyze(options);

        this.emit(
            RuntimeEventType.ANALYSIS_COMPLETED,
            {
                result
            }
        );

        return result;
    }

    async addBet(bet = {}) {
        requireMethod(
            this.runtime,
            "addBet",
            "runtime"
        );

        const result =
            await this.runtime
                .addBet(bet);

        this.emit(
            RuntimeEventType.BET_RECORDED,
            {
                bet:
                    result
            }
        );

        return result;
    }

    async refresh({
        reason = "controller"
    } = {}) {
        let result =
            null;

        if (
            typeof this.runtime
                .updateDashboard ===
                "function"
        ) {
            result =
                await this.runtime
                    .updateDashboard(
                        reason
                    );
        }
        else if (
            typeof this.runtime
                .dashboard
                ?.refreshNow ===
                "function"
        ) {
            result =
                await this.runtime
                    .dashboard
                    .refreshNow();
        }

        this.emit(
            RuntimeEventType.DASHBOARD_UPDATED,
            {
                reason,
                result
            }
        );

        return result;
    }

    pause() {
        this.runtime.pause();

        this.emit(
            RuntimeEventType.RUNTIME_PAUSED,
            this.runtime.summary ??
                null
        );

        return this.summary;
    }

    resume() {
        this.runtime.resume();

        this.emit(
            RuntimeEventType.RUNTIME_RESUMED,
            this.runtime.summary ??
                null
        );

        return this.summary;
    }

    togglePause() {
        if (
            this.runtime.status ===
                "paused"
        ) {
            return this.resume();
        }

        return this.pause();
    }

    async stop(options = {}) {
        const result =
            await this.runtime
                .stop(options);

        this.emit(
            RuntimeEventType.RUNTIME_STOPPED,
            result
        );

        return result;
    }

    async reset(options = {}) {
        requireMethod(
            this.runtime,
            "reset",
            "runtime"
        );

        this.roundController
            ?.reset
            ?.();

        const result =
            await this.runtime
                .reset(options);

        this.emit(
            RuntimeEventType.RUNTIME_RESET,
            result
        );

        return result;
    }

    notifyState() {
        this.onStateChange?.(
            this.summary
        );
    }

    destroy() {
        this.roundController
            ?.destroy
            ?.();

        this.runtime
            ?.destroy
            ?.();

        this.emit(
            RuntimeEventType.RUNTIME_DESTROYED,
            null
        );

        this.lastResult =
            null;

        return this;
    }

    get summary() {
        return {
            version:
                RUNTIME_CONTROLLER_VERSION,

            busy:
                this.busy,

            lastCommand:
                this.lastCommand,

            commandCount:
                this.commandCount,

            lastError:
                this.lastError
                    ?.message ??
                null,

            eventBus:
                this.eventBus
                    ?.summary ??
                null,

            runtime:
                this.runtime.summary ??
                null,

            round:
                this.roundController
                    ?.summary ??
                null
        };
    }
}
