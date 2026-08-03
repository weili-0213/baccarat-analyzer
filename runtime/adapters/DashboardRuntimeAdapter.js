/**
 * Baccarat Analyzer V5.1
 * runtime/adapters/DashboardRuntimeAdapter.js
 *
 * Adapts StatisticsPage / DashboardLayout facade to CasinoRuntime.
 */

export const DASHBOARD_RUNTIME_ADAPTER_VERSION = "5.1.0";

export default class DashboardRuntimeAdapter {
    constructor({
        dashboard
    } = {}) {
        if (
            !dashboard ||
            (
                typeof dashboard.renderSession !==
                    "function" &&
                typeof dashboard.refresh !==
                    "function"
            )
        ) {
            throw new TypeError(
                "DashboardRuntimeAdapter requires renderSession() or refresh()."
            );
        }

        this.dashboard = dashboard;
        this.updateCount = 0;
        this.lastSession = null;
    }

    async renderSession(session) {
        this.lastSession = session;

        let result;

        if (
            typeof this.dashboard
                .renderSession ===
                "function"
        ) {
            result =
                await this.dashboard
                    .renderSession(
                        session
                    );
        }
        else {
            result =
                await this.dashboard
                    .refresh(
                        session
                    );
        }

        this.updateCount++;

        return result;
    }

    refresh(session) {
        return this.renderSession(session);
    }

    pauseLive() {
        this.dashboard?.pauseLive?.();
        return this;
    }

    resumeLive() {
        this.dashboard?.resumeLive?.();
        return this;
    }

    setLayoutMode(mode) {
        this.dashboard
            ?.setLayoutMode
            ?.(mode);

        return this;
    }

    destroy() {
        this.dashboard?.destroy?.();
        this.lastSession = null;

        return this;
    }

    get summary() {
        return {
            version:
                DASHBOARD_RUNTIME_ADAPTER_VERSION,
            updateCount:
                this.updateCount,
            hasLastSession:
                Boolean(this.lastSession)
        };
    }
}
