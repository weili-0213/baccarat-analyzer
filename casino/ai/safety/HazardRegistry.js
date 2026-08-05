/**
 * Baccarat Analyzer V8.7
 * casino/ai/safety/HazardRegistry.js
 */
export const HAZARD_REGISTRY_VERSION = "8.7.0";
export default class HazardRegistry {
    constructor() {
        this.hazards = new Map();
    }
    register({
        hazardId,
        name,
        severity = 1,
        detect,
        metadata = {}
    } = {}) {
        if (typeof hazardId !== "string" || hazardId.length === 0) {
            throw new TypeError("HazardRegistry hazardId is required.");
        }
        if (typeof detect !== "function") {
            throw new TypeError("HazardRegistry detect must be a function.");
        }
        const hazard = {
            hazardId,
            name: name ?? hazardId,
            severity: Number.isFinite(severity) ? severity : 1,
            detect,
            metadata: { ...metadata }
        };
        this.hazards.set(hazardId, hazard);
        return hazard;
    }
    get(hazardId) {
        return this.hazards.get(hazardId) ?? null;
    }
    all() {
        return [...this.hazards.values()];
    }
    unregister(hazardId) {
        return this.hazards.delete(hazardId);
    }
    clear() {
        this.hazards.clear();
        return this;
    }
    get summary() {
        return {
            version: HAZARD_REGISTRY_VERSION,
            count: this.hazards.size
        };
    }
}
