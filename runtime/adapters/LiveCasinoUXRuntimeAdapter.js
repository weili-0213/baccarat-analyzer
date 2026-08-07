/**
 * Baccarat Analyzer V10.4.3
 * Path: runtime/adapters/LiveCasinoUXRuntimeAdapter.js
 * Purpose: Runtime adapter for V10.4.3 live casino UX/performance controller.
 */
export const LIVE_CASINO_UX_RUNTIME_ADAPTER_VERSION = "10.4.3";

export default class LiveCasinoUXRuntimeAdapter {
    constructor({
        controller
    } = {}) {
        if (
            !controller ||
            typeof controller.runAnalysis !==
                "function"
        ) {
            throw new TypeError(
                "LiveCasinoUXRuntimeAdapter requires controller."
            );
        }

        this.controller =
            controller;
    }

    analyze(input = {}) {
        return this.controller
            .runAnalysis(input);
    }

    confirmBurn(card = {}) {
        return this.controller
            .confirmBurn(card);
    }

    finishRound() {
        return this.controller
            .finishRound();
    }

    setProfile(profile) {
        this.controller
            .setProfile(profile);

        return this;
    }

    applyUI(root, options = {}) {
        return this.controller
            .applyUI(root, options);
    }

    destroy() {
        return this.controller
            .destroy();
    }

    get summary() {
        return {
            version:
                LIVE_CASINO_UX_RUNTIME_ADAPTER_VERSION,
            controller:
                this.controller.summary
        };
    }
}
