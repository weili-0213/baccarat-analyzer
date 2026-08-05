/**
 * Baccarat Analyzer V9.0
 * casino/ai/os/EngineRegistry.js
 */
export const ENGINE_REGISTRY_VERSION = "9.0.0";

export default class EngineRegistry {
    constructor() {
        this.engines = new Map();
    }

    register({
        engineId,
        engine,
        adapter = null,
        required = false,
        order = 0,
        metadata = {}
    } = {}) {
        if (
            typeof engineId !== "string" ||
            engineId.length === 0
        ) {
            throw new TypeError(
                "EngineRegistry engineId is required."
            );
        }

        if (!engine) {
            throw new TypeError(
                "EngineRegistry engine is required."
            );
        }

        const record = {
            engineId,
            engine,
            adapter,
            required: Boolean(required),
            order: Number.isFinite(order)
                ? order
                : 0,
            metadata: { ...metadata }
        };

        this.engines.set(engineId, record);
        return record;
    }

    get(engineId) {
        return this.engines.get(engineId) ?? null;
    }

    all() {
        return [...this.engines.values()]
            .sort((a, b) => a.order - b.order);
    }

    unregister(engineId) {
        return this.engines.delete(engineId);
    }

    clear() {
        this.engines.clear();
        return this;
    }

    get summary() {
        return {
            version: ENGINE_REGISTRY_VERSION,
            count: this.engines.size,
            engines: this.all().map(record => ({
                engineId: record.engineId,
                required: record.required,
                order: record.order
            }))
        };
    }
}
