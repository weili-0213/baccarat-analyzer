/**
 * Baccarat Analyzer V6.7
 * runtime/adapters/CasinoCoordinatorRuntimeAdapter.js
 */

export const CASINO_COORDINATOR_RUNTIME_ADAPTER_VERSION = "6.7.0";

export default class CasinoCoordinatorRuntimeAdapter {
    constructor({
        coordinator
    } = {}) {
        if (
            !coordinator ||
            typeof coordinator.start !==
                "function" ||
            typeof coordinator.stop !==
                "function"
        ) {
            throw new TypeError(
                "CasinoCoordinatorRuntimeAdapter requires a CasinoCoordinator-compatible object."
            );
        }

        this.coordinator =
            coordinator;
    }

    initialize(options = {}) {
        return this.coordinator
            .initialize(
                options
            );
    }

    start(options = {}) {
        return this.coordinator.start(
            options
        );
    }

    playRound(input = {}) {
        return this.coordinator
            .playRound(
                input
            );
    }

    pause() {
        return this.coordinator.pause();
    }

    resume() {
        return this.coordinator.resume();
    }

    stop(reason) {
        return this.coordinator.stop(
            reason
        );
    }

    healthCheck() {
        return this.coordinator
            .healthCheck();
    }

    destroy() {
        return this.coordinator
            .destroy();
    }

    get summary() {
        return {
            version:
                CASINO_COORDINATOR_RUNTIME_ADAPTER_VERSION,

            coordinator:
                this.coordinator.summary
        };
    }
}
