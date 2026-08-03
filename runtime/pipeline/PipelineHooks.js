/**
 * Baccarat Analyzer V5.5
 * runtime/pipeline/PipelineHooks.js
 */

export const PIPELINE_HOOKS_VERSION = "5.5.0";

export default class PipelineHooks {
    constructor() {
        this.hooks = {
            beforePipeline: [],
            afterPipeline: [],
            beforeStage: [],
            afterStage: [],
            onSkip: [],
            onRetry: [],
            onError: [],
            onAbort: []
        };
    }

    add(name, handler) {
        if (!(name in this.hooks)) {
            throw new Error(
                `Unknown pipeline hook: ${name}`
            );
        }

        if (typeof handler !== "function") {
            throw new TypeError(
                "Pipeline hook must be a function."
            );
        }

        this.hooks[name].push(handler);

        return () => {
            const index =
                this.hooks[name]
                    .indexOf(handler);

            if (index >= 0) {
                this.hooks[name].splice(
                    index,
                    1
                );
            }
        };
    }

    async run(
        name,
        payload
    ) {
        if (!(name in this.hooks)) {
            throw new Error(
                `Unknown pipeline hook: ${name}`
            );
        }

        for (
            const handler of
            this.hooks[name]
        ) {
            await handler(payload);
        }
    }

    clear(name = null) {
        if (name === null) {
            for (const key of Object.keys(this.hooks)) {
                this.hooks[key] = [];
            }

            return this;
        }

        if (!(name in this.hooks)) {
            throw new Error(
                `Unknown pipeline hook: ${name}`
            );
        }

        this.hooks[name] = [];

        return this;
    }

    get summary() {
        return {
            version:
                PIPELINE_HOOKS_VERSION,

            counts:
                Object.fromEntries(
                    Object.entries(
                        this.hooks
                    ).map(
                        ([key, value]) => [
                            key,
                            value.length
                        ]
                    )
                )
        };
    }
}
