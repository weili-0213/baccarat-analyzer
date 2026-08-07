/**
 * Baccarat Analyzer V10.4
 * Path: runtime/casino/CasinoRuntimeSynchronizer.js
 * Purpose: Synchronizes legacy CasinoRuntime, V10.3 Game Runtime and Dashboard state.
 */
export const CASINO_RUNTIME_SYNCHRONIZER_VERSION = "10.4.0";

export default class CasinoRuntimeSynchronizer {
    snapshot({
        legacyRuntime = null,
        gameRuntime = null,
        sessionStore = null,
        dashboardRuntime = null
    } = {}) {
        return {
            legacyRuntime:
                legacyRuntime?.summary ??
                null,
            gameRuntime:
                gameRuntime?.summary ??
                null,
            session:
                sessionStore?.export?.() ??
                sessionStore?.summary ??
                null,
            dashboard:
                dashboardRuntime?.summary ??
                null
        };
    }

    get summary() {
        return {
            version:
                CASINO_RUNTIME_SYNCHRONIZER_VERSION
        };
    }
}
