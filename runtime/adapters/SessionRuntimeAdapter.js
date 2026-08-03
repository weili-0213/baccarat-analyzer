/**
 * Baccarat Analyzer V5.1
 * runtime/adapters/SessionRuntimeAdapter.js
 *
 * Normalizes SessionStore for CasinoRuntime.
 */

export const SESSION_RUNTIME_ADAPTER_VERSION = "5.1.0";

export default class SessionRuntimeAdapter {
    constructor({
        store
    } = {}) {
        if (
            !store ||
            typeof store.start !== "function" ||
            typeof store.addRound !== "function" ||
            typeof store.addAnalysis !== "function" ||
            typeof store.end !== "function"
        ) {
            throw new TypeError(
                "SessionRuntimeAdapter requires a SessionStore-compatible object."
            );
        }

        this.store = store;
    }

    start(options = {}) {
        return this.store.start(options);
    }

    addRound(round) {
        return this.store.addRound(round);
    }

    addAnalysis(analysis) {
        return this.store.addAnalysis(
            analysis
        );
    }

    addBet(bet) {
        if (
            typeof this.store.addBet !==
                "function"
        ) {
            throw new Error(
                "Session store does not support addBet()."
            );
        }

        return this.store.addBet(bet);
    }

    end(options = {}) {
        return this.store.end(options);
    }

    reset(options = {}) {
        return this.store.reset?.(options);
    }

    export() {
        if (
            typeof this.store.export ===
                "function"
        ) {
            return this.store.export();
        }

        if ("snapshot" in this.store) {
            return this.store.snapshot;
        }

        throw new Error(
            "Session store does not support export()."
        );
    }

    subscribe(listener) {
        return this.store.subscribe?.(
            listener
        ) ?? (() => {});
    }

    get summary() {
        return {
            version:
                SESSION_RUNTIME_ADAPTER_VERSION,
            store:
                this.store.summary ??
                null
        };
    }
}
