/**
 * Baccarat Analyzer V6.4
 * runtime/adapters/SessionEngineRuntimeAdapter.js
 */

export const SESSION_ENGINE_RUNTIME_ADAPTER_VERSION = "6.4.0";

export default class SessionEngineRuntimeAdapter {
    constructor({
        session
    } = {}) {
        if (
            !session ||
            typeof session.start !==
                "function" ||
            typeof session.stop !==
                "function"
        ) {
            throw new TypeError(
                "SessionEngineRuntimeAdapter requires a SessionEngine-compatible object."
            );
        }

        this.session =
            session;
    }

    start(options = {}) {
        return this.session.start(
            options
        );
    }

    pause() {
        return this.session.pause();
    }

    resume() {
        return this.session.resume();
    }

    startRound(input = {}) {
        return this.session.startRound(
            input
        );
    }

    completeRound(input = {}) {
        return this.session.completeRound(
            input
        );
    }

    stop(reason) {
        return this.session.stop(
            reason
        );
    }

    reset() {
        return this.session.reset();
    }

    destroy() {
        this.session.destroy();
        return this;
    }

    get summary() {
        return {
            version:
                SESSION_ENGINE_RUNTIME_ADAPTER_VERSION,

            session:
                this.session.summary
        };
    }
}
