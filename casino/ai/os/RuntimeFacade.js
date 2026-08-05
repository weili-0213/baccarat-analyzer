/**
 * Baccarat Analyzer V9.0
 * casino/ai/os/RuntimeFacade.js
 */
export const RUNTIME_FACADE_VERSION = "9.0.0";

export default class RuntimeFacade {
    constructor({
        registry
    } = {}) {
        if (!registry) {
            throw new TypeError(
                "RuntimeFacade requires EngineRegistry."
            );
        }

        this.registry = registry;
    }

    async invoke(
        engineId,
        method,
        input = {}
    ) {
        const record = this.registry.get(engineId);

        if (!record) {
            throw new Error(
                `Engine ${engineId} is not registered.`
            );
        }

        const target =
            record.adapter ??
            record.engine;

        if (
            !target ||
            typeof target[method] !==
                "function"
        ) {
            throw new Error(
                `${engineId}.${method} is unavailable.`
            );
        }

        return target[method](input);
    }

    has(engineId) {
        return Boolean(
            this.registry.get(engineId)
        );
    }

    get summary() {
        return {
            version: RUNTIME_FACADE_VERSION,
            registeredEngines:
                this.registry.summary.count
        };
    }
}
