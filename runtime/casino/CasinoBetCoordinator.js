/**
 * Baccarat Analyzer V10.4
 * Path: runtime/casino/CasinoBetCoordinator.js
 * Purpose: Coordinates bet persistence and dashboard refresh.
 */
export const CASINO_BET_COORDINATOR_VERSION = "10.4.0";

export default class CasinoBetCoordinator {
    constructor({
        legacyRuntime = null,
        sessionStore = null,
        dashboardRuntime = null
    } = {}) {
        this.legacyRuntime = legacyRuntime;
        this.sessionStore = sessionStore;
        this.dashboardRuntime = dashboardRuntime;
    }

    async addBet(bet) {
        if (this.legacyRuntime?.addBet) {
            return await this.legacyRuntime.addBet(
                bet
            );
        }

        const saved =
            this.sessionStore?.addBet
                ? await this.sessionStore.addBet(
                    bet
                )
                : bet;

        if (this.dashboardRuntime?.renderSession) {
            await this.dashboardRuntime.renderSession(
                this.sessionStore?.export?.() ??
                null
            );
        }

        return saved;
    }

    get summary() {
        return {
            version:
                CASINO_BET_COORDINATOR_VERSION
        };
    }
}
