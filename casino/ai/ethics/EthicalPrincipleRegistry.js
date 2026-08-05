/**
 * Baccarat Analyzer V8.6
 * casino/ai/ethics/EthicalPrincipleRegistry.js
 */

export const ETHICAL_PRINCIPLE_REGISTRY_VERSION = "8.6.0";

export default class EthicalPrincipleRegistry {
    constructor() {
        this.principles = new Map();
    }

    register({
        principleId,
        name,
        weight = 1,
        evaluate,
        metadata = {}
    } = {}) {
        if (
            typeof principleId !== "string" ||
            principleId.length === 0
        ) {
            throw new TypeError(
                "EthicalPrincipleRegistry principleId is required."
            );
        }

        if (typeof evaluate !== "function") {
            throw new TypeError(
                "EthicalPrincipleRegistry evaluate must be a function."
            );
        }

        const principle = {
            principleId,
            name: name ?? principleId,
            weight: Number.isFinite(weight)
                ? weight
                : 1,
            evaluate,
            metadata: { ...metadata }
        };

        this.principles.set(
            principleId,
            principle
        );

        return principle;
    }

    get(principleId) {
        return this.principles.get(principleId) ?? null;
    }

    all() {
        return [...this.principles.values()];
    }

    unregister(principleId) {
        return this.principles.delete(principleId);
    }

    clear() {
        this.principles.clear();
        return this;
    }

    get summary() {
        return {
            version: ETHICAL_PRINCIPLE_REGISTRY_VERSION,
            count: this.principles.size
        };
    }
}
