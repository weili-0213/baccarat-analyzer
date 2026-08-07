/**
 * Baccarat Analyzer V10.4
 * Path: runtime/casino/CasinoSessionCoordinator.js
 * Purpose: Coordinates Casino session, shoe and round sequencing.
 */
export const CASINO_SESSION_COORDINATOR_VERSION = "10.4.0";

export default class CasinoSessionCoordinator {
    constructor({
        clock = () => Date.now()
    } = {}) {
        if (typeof clock !== "function") {
            throw new TypeError(
                "CasinoSessionCoordinator clock must be a function."
            );
        }

        this.clock = clock;
        this.sessionSequence = 0;
        this.roundSequence = 0;
        this.casinoSessionId = null;
        this.shoeId = null;
        this.roundId = null;
        this.roundNumber = 0;
    }

    start({
        casinoSessionId = null,
        shoeId = null
    } = {}) {
        this.sessionSequence++;

        this.casinoSessionId =
            casinoSessionId ??
            `casino-session-${this.clock()}-${this.sessionSequence}`;

        this.shoeId =
            shoeId ??
            `casino-shoe-${this.clock()}-${this.sessionSequence}`;

        this.roundSequence = 0;
        this.roundId = null;
        this.roundNumber = 0;

        return this.snapshot();
    }

    beginRound(roundId = null) {
        this.roundSequence++;
        this.roundNumber++;

        this.roundId =
            roundId ??
            `casino-round-${this.clock()}-${this.roundSequence}`;

        return this.snapshot();
    }

    resetShoe(shoeId = null) {
        this.shoeId =
            shoeId ??
            `casino-shoe-${this.clock()}-${this.sessionSequence}`;

        this.roundSequence = 0;
        this.roundId = null;
        this.roundNumber = 0;

        return this.snapshot();
    }

    reset() {
        this.casinoSessionId = null;
        this.shoeId = null;
        this.roundId = null;
        this.roundNumber = 0;
        this.roundSequence = 0;
        return this;
    }

    snapshot() {
        return {
            version: CASINO_SESSION_COORDINATOR_VERSION,
            casinoSessionId: this.casinoSessionId,
            shoeId: this.shoeId,
            roundId: this.roundId,
            roundNumber: this.roundNumber
        };
    }
}
