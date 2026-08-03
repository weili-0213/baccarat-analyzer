/**
 * Baccarat Analyzer V5.5
 * runtime/pipeline/PipelineContext.js
 */

export const PIPELINE_CONTEXT_VERSION = "5.5.0";

function cloneValue(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return value;
    }

    if (
        typeof structuredClone ===
            "function"
    ) {
        try {
            return structuredClone(
                value
            );
        }
        catch {
            // Fall through.
        }
    }

    return JSON.parse(
        JSON.stringify(value)
    );
}

export default class PipelineContext {
    constructor(initial = {}) {
        this.data = {
            runtime: null,
            game: null,
            round: null,
            analysis: null,
            ranking: null,
            recommendation: null,
            bet: null,
            session: null,
            dashboard: null,
            report: null,
            metadata: {},
            runtimeState: null,
            ...cloneValue(initial)
        };

        this.changes = [];
    }

    get(key, fallback = null) {
        return (
            key in this.data
                ? this.data[key]
                : fallback
        );
    }

    set(key, value) {
        const previous =
            this.data[key];

        this.data[key] =
            value;

        this.changes.push({
            key,
            previous:
                cloneValue(previous),
            current:
                cloneValue(value)
        });

        return this;
    }

    merge(values = {}) {
        for (
            const [key, value] of
            Object.entries(values)
        ) {
            this.set(key, value);
        }

        return this;
    }

    has(key) {
        return key in this.data;
    }

    snapshot() {
        return cloneValue(
            this.data
        );
    }

    clear() {
        this.data = {};
        this.changes = [];

        return this;
    }

    get summary() {
        return {
            version:
                PIPELINE_CONTEXT_VERSION,

            keys:
                Object.keys(this.data),

            changeCount:
                this.changes.length
        };
    }
}
