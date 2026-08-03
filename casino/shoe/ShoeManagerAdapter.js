/**
 * Baccarat Analyzer V6.3
 * casino/shoe/ShoeManagerAdapter.js
 *
 * Adapts ShoeManager to CasinoEngine shoe lifecycle.
 */

export const SHOE_MANAGER_ADAPTER_VERSION = "6.3.0";

export default class ShoeManagerAdapter {
    constructor({
        manager
    } = {}) {
        if (
            !manager ||
            typeof manager.create !==
                "function"
        ) {
            throw new TypeError(
                "ShoeManagerAdapter requires manager.create()."
            );
        }

        this.manager =
            manager;
    }

    async create(options = {}) {
        return this.manager.create(
            options
        );
    }

    shuffle() {
        return this.manager.shuffle();
    }

    draw() {
        if (
            !this.manager.shoe ||
            typeof this.manager.shoe.draw !==
                "function"
        ) {
            throw new Error(
                "Managed shoe draw() is unavailable."
            );
        }

        return this.manager.shoe.draw();
    }

    beginRound() {
        return this.manager.beginRound();
    }

    recordRound(result) {
        return this.manager.recordRound(
            result
        );
    }

    reset(options = {}) {
        return this.manager.reset(
            options
        );
    }

    complete(reason) {
        return this.manager.complete(
            reason
        );
    }

    destroy() {
        this.manager.destroy();
        return this;
    }

    get remaining() {
        return this.manager
            .getRemainingCards();
    }

    get summary() {
        return {
            version:
                SHOE_MANAGER_ADAPTER_VERSION,

            manager:
                this.manager.summary
        };
    }
}
