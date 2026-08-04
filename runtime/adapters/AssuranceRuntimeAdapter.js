/**
 * Baccarat Analyzer V7.8
 * runtime/adapters/AssuranceRuntimeAdapter.js
 */

export const ASSURANCE_RUNTIME_ADAPTER_VERSION = "7.8.0";

export default class AssuranceRuntimeAdapter {
    constructor({
        assurance
    } = {}) {
        if (
            !assurance ||
            typeof assurance.inspect !==
                "function"
        ) {
            throw new TypeError(
                "AssuranceRuntimeAdapter requires an AssuranceEngine-compatible object."
            );
        }

        this.assurance =
            assurance;
    }

    inspect(input = {}) {
        return this.assurance.inspect(
            input
        );
    }

    registerCheck(check) {
        return this.assurance.registerCheck(
            check
        );
    }

    pause() {
        return this.assurance.pause();
    }

    resume() {
        return this.assurance.resume();
    }

    reset() {
        return this.assurance.reset();
    }

    destroy() {
        return this.assurance.destroy();
    }

    get summary() {
        return {
            version:
                ASSURANCE_RUNTIME_ADAPTER_VERSION,

            assurance:
                this.assurance.summary
        };
    }
}
