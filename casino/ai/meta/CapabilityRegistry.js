/**
 * Baccarat Analyzer V8.8
 * casino/ai/meta/CapabilityRegistry.js
 */

export const CAPABILITY_REGISTRY_VERSION = "8.8.0";

export default class CapabilityRegistry {
    constructor() {
        this.capabilities = new Map();
    }

    register({
        capabilityId,
        name,
        weight = 1,
        assess,
        metadata = {}
    } = {}) {
        if (
            typeof capabilityId !== "string" ||
            capabilityId.length === 0
        ) {
            throw new TypeError(
                "CapabilityRegistry capabilityId is required."
            );
        }

        if (typeof assess !== "function") {
            throw new TypeError(
                "CapabilityRegistry assess must be a function."
            );
        }

        const capability = {
            capabilityId,
            name: name ?? capabilityId,
            weight: Number.isFinite(weight)
                ? weight
                : 1,
            assess,
            metadata: { ...metadata }
        };

        this.capabilities.set(
            capabilityId,
            capability
        );

        return capability;
    }

    get(capabilityId) {
        return this.capabilities.get(capabilityId) ?? null;
    }

    all() {
        return [...this.capabilities.values()];
    }

    unregister(capabilityId) {
        return this.capabilities.delete(capabilityId);
    }

    clear() {
        this.capabilities.clear();
        return this;
    }

    get summary() {
        return {
            version: CAPABILITY_REGISTRY_VERSION,
            count: this.capabilities.size
        };
    }
}
