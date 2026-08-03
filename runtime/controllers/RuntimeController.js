/**
 * Baccarat Analyzer V5.2
 * runtime/controllers/RuntimeController.js
 *
 * High-level application controller for CasinoRuntime.
 *
 * UI components should call this controller instead of calling
 * CasinoRuntime directly.
 */

export const RUNTIME_CONTROLLER_VERSION = "5.2.0";

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

function requireMethod(target, method, name) {
    if (
        !target ||
        typeof target[method] !== "function"
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

        this.roundController =
            roundController;

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

    async execute(command, payload = {}) {
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

            return result;
        }
        catch (error) {
            this.lastError =
                error;

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
        return this.runtime.start(
            options
        );
    }

    async newShoe(options = {}) {
        if (
            typeof this.runtime.reset ===
                "function"
        ) {
            return this.runtime.reset(
                options
            );
        }

        await this.runtime.stop();

        return this.runtime.start(
            options
        );
    }

    async startRound(input = {}) {
        return this.runtime
            .startRound(
                input
            );
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

        return result;
    }

    async analyze(options = {}) {
        requireMethod(
            this.runtime,
            "analyze",
            "runtime"
        );

        return this.runtime.analyze(
            options
        );
    }

    async addBet(bet = {}) {
        requireMethod(
            this.runtime,
            "addBet",
            "runtime"
        );

        return this.runtime.addBet(
            bet
        );
    }

    async refresh({
        reason = "controller"
    } = {}) {
        if (
            typeof this.runtime
                .updateDashboard ===
                "function"
        ) {
            return this.runtime
                .updateDashboard(
                    reason
                );
        }

        if (
            typeof this.runtime
                .dashboard
                ?.refreshNow ===
                "function"
        ) {
            return this.runtime
                .dashboard
                .refreshNow();
        }

        return null;
    }

    pause() {
        this.runtime.pause();
        return this.summary;
    }

    resume() {
        this.runtime.resume();
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
        return this.runtime.stop(
            options
        );
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

        return this.runtime.reset(
            options
        );
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
