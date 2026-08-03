/**
 * Baccarat Analyzer V6.6
 * runtime/adapters/DashboardEngineRuntimeAdapter.js
 */

export const DASHBOARD_ENGINE_RUNTIME_ADAPTER_VERSION = "6.6.0";

export default class DashboardEngineRuntimeAdapter {
    constructor({
        dashboard
    } = {}) {
        if (
            !dashboard ||
            typeof dashboard.update !==
                "function"
        ) {
            throw new TypeError(
                "DashboardEngineRuntimeAdapter requires a DashboardEngine-compatible object."
            );
        }

        this.dashboard =
            dashboard;
    }

    mount(target = null) {
        return this.dashboard.mount(
            target
        );
    }

    update(input = {}) {
        return this.dashboard.update(
            input
        );
    }

    updateFromAnalysis(
        input = {}
    ) {
        return this.dashboard
            .updateFromAnalysis(
                input
            );
    }

    pause() {
        return this.dashboard.pause();
    }

    resume() {
        return this.dashboard.resume();
    }

    clear() {
        return this.dashboard.clear();
    }

    destroy() {
        return this.dashboard.destroy();
    }

    get summary() {
        return {
            version:
                DASHBOARD_ENGINE_RUNTIME_ADAPTER_VERSION,

            dashboard:
                this.dashboard.summary
        };
    }
}
