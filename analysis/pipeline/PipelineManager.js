/**
 * Baccarat Analyzer V3.5
 * analysis/pipeline/PipelineManager.js
 */

export const PIPELINE_MANAGER_VERSION = "3.5.0";

function isObject(value) {
    return value !== null &&
        typeof value === "object" &&
        !Array.isArray(value);
}

function createAbortError(message = "Pipeline execution aborted.") {
    if (typeof DOMException === "function") {
        return new DOMException(message, "AbortError");
    }

    const error = new Error(message);
    error.name = "AbortError";
    return error;
}

function now() {
    return globalThis.performance?.now?.() ?? Date.now();
}

function normalizeDefinition(definition, index) {
    if (!isObject(definition)) {
        throw new TypeError("Pipeline definition must be an object.");
    }

    if (typeof definition.name !== "string" || !definition.name.trim()) {
        throw new TypeError("Pipeline name is required.");
    }

    if (typeof definition.run !== "function") {
        throw new TypeError(`Pipeline "${definition.name}" requires run().`);
    }

    const requires = definition.requires ?? [];

    if (!Array.isArray(requires)) {
        throw new TypeError(
            `Pipeline "${definition.name}" requires must be an array.`
        );
    }

    return {
        name: definition.name.trim(),
        run: definition.run,
        enabled: definition.enabled !== false,
        priority: Number.isFinite(definition.priority)
            ? definition.priority
            : 0,
        requires: [...requires],
        metadata: isObject(definition.metadata)
            ? { ...definition.metadata }
            : {},
        index
    };
}

export default class PipelineManager {
    constructor({
        pipelines = [],
        stopOnError = true,
        includeTiming = true
    } = {}) {
        this.options = {
            stopOnError: Boolean(stopOnError),
            includeTiming: Boolean(includeTiming)
        };

        this.registry = new Map();
        this.registrationIndex = 0;
        this.lastResult = null;
        this.lastError = null;
        this.runCount = 0;

        for (const pipeline of pipelines) {
            this.register(pipeline);
        }
    }

    register(definition) {
        const normalized = normalizeDefinition(
            definition,
            this.registrationIndex++
        );

        if (this.registry.has(normalized.name)) {
            throw new Error(
                `Pipeline "${normalized.name}" is already registered.`
            );
        }

        this.registry.set(normalized.name, normalized);
        return this;
    }

    unregister(name) {
        return this.registry.delete(name);
    }

    has(name) {
        return this.registry.has(name);
    }

    get(name) {
        return this.registry.get(name) ?? null;
    }

    requirePipeline(name) {
        const pipeline = this.get(name);

        if (!pipeline) {
            throw new Error(`Unknown pipeline: ${name}`);
        }

        return pipeline;
    }

    enable(name) {
        this.requirePipeline(name).enabled = true;
        return this;
    }

    disable(name) {
        this.requirePipeline(name).enabled = false;
        return this;
    }

    orderedPipelines() {
        return [...this.registry.values()]
            .filter(item => item.enabled)
            .sort((left, right) => {
                if (left.priority !== right.priority) {
                    return left.priority - right.priority;
                }

                return left.index - right.index;
            });
    }

    validateDependencies(pipeline, state) {
        for (const key of pipeline.requires) {
            if (!(key in state)) {
                throw new Error(
                    `Pipeline "${pipeline.name}" requires state.${key}.`
                );
            }
        }
    }

    throwIfAborted(signal) {
        if (signal?.aborted) {
            throw createAbortError();
        }
    }

    async run(
        initialState = {},
        {
            signal = null,
            onBeforeStep = null,
            onAfterStep = null,
            onError = null
        } = {}
    ) {
        if (!isObject(initialState)) {
            throw new TypeError(
                "Pipeline initialState must be an object."
            );
        }

        this.throwIfAborted(signal);

        const state = { ...initialState };
        const execution = [];
        const startedAt = now();

        this.runCount++;
        this.lastError = null;

        for (const pipeline of this.orderedPipelines()) {
            this.throwIfAborted(signal);
            this.validateDependencies(pipeline, state);

            const stepStartedAt = now();
            const stepContext = {
                name: pipeline.name,
                state,
                signal,
                metadata: { ...pipeline.metadata },
                manager: this
            };

            await onBeforeStep?.(stepContext);

            try {
                const output = await pipeline.run(stepContext);

                if (output !== undefined) {
                    if (!isObject(output)) {
                        throw new TypeError(
                            `Pipeline "${pipeline.name}" must return an object or undefined.`
                        );
                    }

                    Object.assign(state, output);
                }

                const record = {
                    name: pipeline.name,
                    status: "completed",
                    durationMs: this.options.includeTiming
                        ? now() - stepStartedAt
                        : null,
                    outputKeys: isObject(output)
                        ? Object.keys(output)
                        : []
                };

                execution.push(record);

                await onAfterStep?.({
                    ...stepContext,
                    output,
                    record
                });
            }
            catch (error) {
                const record = {
                    name: pipeline.name,
                    status: "failed",
                    durationMs: this.options.includeTiming
                        ? now() - stepStartedAt
                        : null,
                    error: error?.message ?? String(error)
                };

                execution.push(record);
                this.lastError = error;

                await onError?.({
                    ...stepContext,
                    error,
                    record
                });

                if (this.options.stopOnError) {
                    error.pipeline = pipeline.name;
                    error.execution = execution;
                    throw error;
                }
            }
        }

        const result = {
            version: PIPELINE_MANAGER_VERSION,
            state,
            execution,
            durationMs: this.options.includeTiming
                ? now() - startedAt
                : null,
            completed: execution.filter(
                item => item.status === "completed"
            ).length,
            failed: execution.filter(
                item => item.status === "failed"
            ).length
        };

        this.lastResult = result;
        return result;
    }

    async runStep(name, initialState = {}, options = {}) {
        const pipeline = this.requirePipeline(name);

        if (!pipeline.enabled) {
            throw new Error(`Pipeline "${name}" is disabled.`);
        }

        const temporary = new PipelineManager({
            stopOnError: this.options.stopOnError,
            includeTiming: this.options.includeTiming
        });

        temporary.register({
            name: pipeline.name,
            run: pipeline.run,
            priority: pipeline.priority,
            requires: pipeline.requires,
            metadata: pipeline.metadata
        });

        return temporary.run(initialState, options);
    }

    clear() {
        this.registry.clear();
        this.registrationIndex = 0;
        this.lastResult = null;
        this.lastError = null;
        return this;
    }

    get size() {
        return this.registry.size;
    }

    get names() {
        return [...this.registry.keys()];
    }

    get summary() {
        return {
            version: PIPELINE_MANAGER_VERSION,
            size: this.size,
            enabled: this.orderedPipelines().map(item => item.name),
            runCount: this.runCount,
            lastDurationMs: this.lastResult?.durationMs ?? null,
            lastError: this.lastError?.message ?? null
        };
    }
}
