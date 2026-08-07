/**
 * Baccarat Analyzer V10.4
 * Path: runtime/casino/CasinoDashboardBridge.js
 * Purpose: Pushes Casino/Game/AI runtime snapshots to the Dashboard layer.
 */
export const CASINO_DASHBOARD_BRIDGE_VERSION = "10.4.0";

export default class CasinoDashboardBridge {
    constructor({
        dashboardRuntime = null
    } = {}) {
        this.dashboardRuntime =
            dashboardRuntime;

        this.updateCount =
            0;
    }

    async update(snapshot) {
        this.updateCount++;

        if (
            typeof this.dashboardRuntime
                ?.renderSession ===
            "function"
        ) {
            return await this.dashboardRuntime
                .renderSession(
                    snapshot?.session ??
                    snapshot
                );
        }

        if (
            typeof this.dashboardRuntime
                ?.update ===
            "function"
        ) {
            return await this.dashboardRuntime
                .update(
                    snapshot
                );
        }

        return snapshot;
    }

    pause() {
        this.dashboardRuntime
            ?.pauseLive?.();

        return this;
    }

    resume() {
        this.dashboardRuntime
            ?.resumeLive?.();

        return this;
    }

    get summary() {
        return {
            version:
                CASINO_DASHBOARD_BRIDGE_VERSION,
            updateCount:
                this.updateCount
        };
    }
}
