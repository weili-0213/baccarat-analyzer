/**
 * Baccarat Analyzer V6.7
 * casino/coordinator/EngineRegistry.js
 */

export const ENGINE_REGISTRY_VERSION = "6.7.0";

export default class EngineRegistry {
    constructor() {
        this.engines = new Map();
    }

    register(name, engine) {
        if (
            typeof name !== "string" ||
            name.length === 0
        ) {
            throw new TypeError(
                "EngineRegistry name must be a non-empty string."
            );
        }

        if (!engine) {
            throw new TypeError(
                "EngineRegistry requires an engine."
            );
        }

        if (this.engines.has(name)) {
            throw new Error(
                `Engine already registered: ${name}`
            );
        }

        this.engines.set(
            name,
            engine
        );

        return engine;
    }

    replace(name, engine) {
        if (!engine) {
            throw new TypeError(
                "EngineRegistry requires an engine."
            );
        }

        this.engines.set(
            name,
            engine
        );

        return engine;
    }

    unregister(name) {
        return this.engines.delete(
            name
        );
    }

    has(name) {
        return this.engines.has(name);
    }

    get(name) {
        return (
            this.engines.get(name) ??
            null
        );
    }

    entries() {
        return [
            ...this.engines.entries()
        ];
    }

    values() {
        return [
            ...this.engines.values()
        ];
    }

    clear() {
        this.engines.clear();
        return this;
    }

    get summary() {
        return {
            version:
                ENGINE_REGISTRY_VERSION,

            count:
                this.engines.size,

            names:
                [
                    ...this.engines.keys()
                ]
        };
    }
}
