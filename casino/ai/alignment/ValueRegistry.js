/**
 * Baccarat Analyzer V8.5
 * casino/ai/alignment/ValueRegistry.js
 */

export const VALUE_REGISTRY_VERSION = "8.5.0";

export default class ValueRegistry {
    constructor() {
        this.values = new Map();
    }

    register({
        valueId,
        name,
        weight = 1,
        evaluate,
        metadata = {}
    } = {}) {
        if (
            typeof valueId !== "string" ||
            valueId.length === 0
        ) {
            throw new TypeError(
                "ValueRegistry valueId is required."
            );
        }

        if (typeof evaluate !== "function") {
            throw new TypeError(
                "ValueRegistry evaluate must be a function."
            );
        }

        const value = {
            valueId,
            name: name ?? valueId,
            weight: Number.isFinite(weight)
                ? weight
                : 1,
            evaluate,
            metadata: { ...metadata }
        };

        this.values.set(
            valueId,
            value
        );

        return value;
    }

    get(valueId) {
        return this.values.get(valueId) ?? null;
    }

    all() {
        return [...this.values.values()];
    }

    unregister(valueId) {
        return this.values.delete(valueId);
    }

    clear() {
        this.values.clear();
        return this;
    }

    get summary() {
        return {
            version: VALUE_REGISTRY_VERSION,
            count: this.values.size
        };
    }
}
