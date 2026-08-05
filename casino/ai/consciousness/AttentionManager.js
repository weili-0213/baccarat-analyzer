/**
 * Baccarat Analyzer V8.4
 * casino/ai/consciousness/AttentionManager.js
 */

export const ATTENTION_MANAGER_VERSION = "8.4.0";

export default class AttentionManager {
    constructor({
        capacity = 5
    } = {}) {
        if (
            !Number.isInteger(capacity) ||
            capacity < 1
        ) {
            throw new RangeError(
                "AttentionManager capacity must be positive."
            );
        }

        this.capacity = capacity;
    }

    focus(items = []) {
        const ranked =
            [...items]
                .map(
                    item => ({
                        ...item,
                        salience:
                            Number.isFinite(
                                item.salience
                            )
                                ? item.salience
                                : 0
                    })
                )
                .sort(
                    (a, b) =>
                        b.salience - a.salience
                )
                .slice(
                    0,
                    this.capacity
                );

        return {
            capacity:
                this.capacity,
            focused:
                ranked,
            ignored:
                Math.max(
                    0,
                    items.length -
                    ranked.length
                )
        };
    }

    get summary() {
        return {
            version:
                ATTENTION_MANAGER_VERSION,
            capacity:
                this.capacity
        };
    }
}
