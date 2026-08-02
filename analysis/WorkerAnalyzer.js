/**
 * Baccarat Analyzer V3.4-1
 * analysis/WorkerAnalyzer.js
 *
 * Analysis Worker Pipeline
 *
 * 功能：
 * - Game 相容介面：analyzeContext / run / setContext / analyze
 * - latest-wins：新分析會取消尚未送出的舊分析
 * - debounce：合併短時間內的重複分析
 * - request token：舊結果不可覆蓋新結果
 * - LRU cache
 * - progress event
 * - Worker error recovery
 * - retry
 * - main-thread fallback
 */

import Analyzer
    from "./analyzer.js";


export const WORKER_ANALYZER_VERSION =
    "3.4.1";


const DEFAULT_OPTIONS =
    Object.freeze({

        debounceMs:
            40,

        cache:
            true,

        cacheSize:
            24,

        latestWins:
            true,

        retryCount:
            1,

        fallback:
            true,

        lazy:
            true

    });


function isObject(value) {

    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );

}


function clonePlainData(value) {

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

            // JSON fallback
        }

    }


    return JSON.parse(
        JSON.stringify(value)
    );

}


function stableStringify(value) {

    if (
        value === null ||
        typeof value !==
            "object"
    ) {

        return JSON.stringify(
            value
        );

    }


    if (
        Array.isArray(value)
    ) {

        return `[${value
            .map(stableStringify)
            .join(",")}]`;

    }


    return `{${Object.keys(value)
        .sort()
        .map(
            key =>
                `${JSON.stringify(key)}:${stableStringify(value[key])}`
        )
        .join(",")}}`;

}


function createRequestId() {

    return (
        globalThis.crypto
            ?.randomUUID?.() ??
        `analysis-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`
    );

}


function createAbortError(
    message =
        "Analysis aborted."
) {

    if (
        typeof DOMException ===
            "function"
    ) {

        return new DOMException(
            message,
            "AbortError"
        );

    }


    const error =
        new Error(message);

    error.name =
        "AbortError";

    return error;

}


function createWorkerError(data) {

    const error =
        new Error(
            data?.message ??
            "Worker analysis failed."
        );

    error.name =
        data?.name ??
        "WorkerAnalysisError";

    if (data?.stack) {

        error.stack =
            data.stack;

    }

    return error;

}


export default class WorkerAnalyzer {

    constructor({

        workerURL =
            new URL(
                "../workers/analyzer.worker.js",
                import.meta.url
            ),

        workerOptions =
            {
                type:
                    "module"
            },

        fallbackAnalyzer =
            null,

        ...options

    } = {}) {

        this.options = {

            ...DEFAULT_OPTIONS,

            ...options

        };


        this.validateOptions();


        this.workerURL =
            workerURL;

        this.workerOptions = {

            ...workerOptions

        };

        this.fallbackAnalyzer =
            fallbackAnalyzer ??
            new Analyzer();


        this.worker =
            null;

        this.context =
            null;

        this.pending =
            new Map();

        this.cache =
            new Map();

        this.debounceEntry =
            null;

        this.token =
            0;

        this.latestCommittedToken =
            0;

        this.destroyed =
            false;

        this.lastEngine =
            "none";

        this.lastError =
            null;

        this.lastResult =
            null;


        this.boundMessage =
            event =>
                this.handleMessage(
                    event
                );

        this.boundError =
            event =>
                this.handleWorkerFailure(
                    event
                );


        if (!this.options.lazy) {

            this.ensureWorker();

        }

    }


    validateOptions() {

        if (
            !Number.isFinite(
                this.options.debounceMs
            ) ||
            this.options.debounceMs < 0
        ) {

            throw new RangeError(
                "debounceMs must be a non-negative number."
            );

        }


        if (
            !Number.isInteger(
                this.options.cacheSize
            ) ||
            this.options.cacheSize < 1
        ) {

            throw new RangeError(
                "cacheSize must be a positive integer."
            );

        }


        if (
            !Number.isInteger(
                this.options.retryCount
            ) ||
            this.options.retryCount < 0
        ) {

            throw new RangeError(
                "retryCount must be a non-negative integer."
            );

        }

    }


    setContext(context = {}) {

        if (!isObject(context)) {

            throw new TypeError(
                "WorkerAnalyzer context must be an object."
            );

        }

        this.context =
            context;

        return this;

    }


    run(
        context = {},
        runOptions = {}
    ) {

        return this.analyzeContext(
            context,
            runOptions
        );

    }


    analyze(runOptions = {}) {

        if (!this.context) {

            return Promise.reject(
                new Error(
                    "WorkerAnalyzer context has not been set."
                )
            );

        }

        return this.analyzeContext(
            this.context,
            runOptions
        );

    }


    analyzeContext(
        context = {},
        runOptions = {}
    ) {

        if (this.destroyed) {

            return Promise.reject(
                new Error(
                    "WorkerAnalyzer has been destroyed."
                )
            );

        }


        if (
            !isObject(context) ||
            !context.shoe
        ) {

            return Promise.reject(
                new TypeError(
                    "WorkerAnalyzer context requires a Shoe."
                )
            );

        }


        if (!isObject(runOptions)) {

            return Promise.reject(
                new TypeError(
                    "runOptions must be an object."
                )
            );

        }


        this.context =
            context;

        const token =
            ++this.token;


        if (
            this.options.latestWins
        ) {

            this.cancelDebounced(
                createAbortError(
                    "Superseded by newer analysis."
                )
            );

            this.cancelPending(
                createAbortError(
                    "Superseded by newer analysis."
                )
            );

        }


        return new Promise(
            (
                resolve,
                reject
            ) => {

                const entry = {

                    token,
                    context,
                    runOptions,
                    resolve,
                    reject,
                    timer:
                        null

                };


                const delay =
                    Number(
                        runOptions
                            .debounceMs ??
                        this.options
                            .debounceMs
                    );


                if (delay <= 0) {

                    this.executeEntry(
                        entry
                    );

                    return;

                }


                entry.timer =
                    setTimeout(
                        () => {

                            if (
                                this.debounceEntry ===
                                    entry
                            ) {

                                this.debounceEntry =
                                    null;

                            }

                            this.executeEntry(
                                entry
                            );

                        },
                        delay
                    );


                this.debounceEntry =
                    entry;

            }
        );

    }


    async executeEntry(entry) {

        const {
            token,
            context,
            runOptions,
            resolve,
            reject
        } = entry;


        try {

            const prepared =
                this.createWorkerPayload(
                    context,
                    runOptions
                );

            const cacheKey =
                this.createCacheKey(
                    prepared.payload
                );


            if (
                this.options.cache &&
                this.cache.has(
                    cacheKey
                )
            ) {

                const result =
                    clonePlainData(
                        this.cache.get(
                            cacheKey
                        )
                    );


                this.touchCache(
                    cacheKey,
                    result
                );

                this.commitResult(
                    token,
                    result,
                    "cache"
                );

                resolve(
                    result
                );

                return;

            }


            let lastError =
                null;

            const attempts =
                this.options.retryCount +
                1;


            for (
                let attempt = 0;
                attempt < attempts;
                attempt++
            ) {

                try {

                    const result =
                        await this
                            .analyzeInWorker(
                                prepared,
                                token,
                                attempt
                            );


                    if (
                        token !==
                        this.token
                    ) {

                        throw createAbortError(
                            "Stale analysis result ignored."
                        );

                    }


                    if (
                        this.options.cache
                    ) {

                        this.setCache(
                            cacheKey,
                            result
                        );

                    }


                    this.commitResult(
                        token,
                        result,
                        "worker"
                    );

                    resolve(
                        result
                    );

                    return;

                }
                catch (error) {

                    lastError =
                        error;


                    if (
                        error?.name ===
                            "AbortError"
                    ) {

                        throw error;

                    }


                    this.lastError =
                        error;

                    this.releaseWorker();


                    if (
                        attempt <
                        attempts -
                            1
                    ) {

                        continue;

                    }

                }

            }


            if (
                !this.options.fallback
            ) {

                throw lastError;

            }


            const result =
                await this
                    .analyzeOnMainThread(
                        context,
                        runOptions
                    );


            if (
                token !==
                this.token
            ) {

                throw createAbortError(
                    "Stale fallback result ignored."
                );

            }


            if (
                this.options.cache
            ) {

                this.setCache(
                    cacheKey,
                    result
                );

            }


            this.commitResult(
                token,
                result,
                "main"
            );

            resolve(
                result
            );

        }
        catch (error) {

            reject(
                error
            );

        }

    }


    ensureWorker() {

        if (this.destroyed) {

            throw new Error(
                "WorkerAnalyzer has been destroyed."
            );

        }


        if (this.worker) {

            return this.worker;

        }


        if (
            typeof Worker ===
                "undefined"
        ) {

            throw new Error(
                "Web Worker is not supported in this environment."
            );

        }


        this.worker =
            new Worker(
                this.workerURL,
                this.workerOptions
            );


        this.worker.addEventListener(
            "message",
            this.boundMessage
        );

        this.worker.addEventListener(
            "error",
            this.boundError
        );

        this.worker.addEventListener(
            "messageerror",
            this.boundError
        );


        return this.worker;

    }


    createWorkerPayload(
        context,
        runOptions
    ) {

        if (
            typeof context.shoe
                ?.toJSON !==
                "function"
        ) {

            throw new TypeError(
                "WorkerAnalyzer requires context.shoe.toJSON()."
            );

        }


        const {
            signal,
            onProgress,
            onMonteCarloProgress,
            onExactProgress,
            debounceMs,
            bypassCache,
            ...serializableRunOptions
        } = runOptions;


        return {

            payload: {

                shoe:
                    context.shoe
                        .toJSON(),

                roundCount:
                    context.roundCount ??
                    context.history
                        ?.count ??
                    0,

                historyCount:
                    context.history
                        ?.count ??
                    context.roundCount ??
                    0,

                contextOptions:
                    clonePlainData({

                        payouts:
                            context.payouts ??
                            {},

                        monteCarloOptions:
                            context
                                .monteCarloOptions ??
                            {},

                        exactOptions:
                            context
                                .exactOptions ??
                            {},

                        kellyOptions:
                            context
                                .kellyOptions ??
                            {},

                        riskOptions:
                            context
                                .riskOptions ??
                            {},

                        confidenceOptions:
                            context
                                .confidenceOptions ??
                            {},

                        rankingOptions:
                            context
                                .rankingOptions ??
                            {},

                        recommendationOptions:
                            context
                                .recommendationOptions ??
                            {},

                        bankroll:
                            context.bankroll,

                        fraction:
                            context.fraction,

                        minBet:
                            context.minBet,

                        maxBet:
                            context.maxBet,

                        maxBankrollRatio:
                            context
                                .maxBankrollRatio,

                        analyzerOptions:
                            context
                                .analyzerOptions ??
                            {}

                    }),

                runOptions:
                    clonePlainData(
                        serializableRunOptions
                    )

            },

            signal:
                signal ??
                null,

            bypassCache:
                Boolean(
                    bypassCache
                ),

            onProgress:
                typeof onProgress ===
                    "function"
                    ? onProgress
                    : progress => {

                        if (
                            progress.phase ===
                                "monteCarlo"
                        ) {

                            onMonteCarloProgress
                                ?.(
                                    progress
                                        .progress
                                );

                        }

                        if (
                            progress.phase ===
                                "exact"
                        ) {

                            onExactProgress
                                ?.(
                                    progress
                                        .progress
                                );

                        }

                    }

        };

    }


    createCacheKey(payload) {

        return stableStringify(
            payload
        );

    }


    analyzeInWorker(
        prepared,
        token,
        attempt
    ) {

        const worker =
            this.ensureWorker();

        const requestId =
            createRequestId();


        return new Promise(
            (
                resolve,
                reject
            ) => {

                const abort =
                    () =>
                        this.cancel(
                            requestId,
                            createAbortError()
                        );


                if (
                    prepared.signal
                        ?.aborted
                ) {

                    reject(
                        createAbortError()
                    );

                    return;

                }


                prepared.signal
                    ?.addEventListener(
                        "abort",
                        abort,
                        {
                            once:
                                true
                        }
                    );


                this.pending.set(
                    requestId,
                    {

                        requestId,
                        token,
                        attempt,
                        resolve,
                        reject,

                        onProgress:
                            prepared
                                .onProgress,

                        signal:
                            prepared
                                .signal,

                        abort

                    }
                );


                worker.postMessage({

                    type:
                        "analyze",

                    requestId,

                    token,

                    attempt,

                    payload:
                        prepared.payload

                });

            }
        );

    }


    async analyzeOnMainThread(
        context,
        runOptions
    ) {

        const {
            signal,
            debounceMs,
            bypassCache,
            ...safeRunOptions
        } = runOptions;


        if (signal?.aborted) {

            throw createAbortError();

        }


        const analyzer =
            this.fallbackAnalyzer;


        if (
            typeof analyzer
                .analyzeContext ===
                "function"
        ) {

            return analyzer
                .analyzeContext(
                    context,
                    safeRunOptions
                );

        }


        if (
            typeof analyzer.run ===
                "function"
        ) {

            return analyzer.run(
                context,
                safeRunOptions
            );

        }


        analyzer.setContext(
            context
        );

        return analyzer.analyze(
            safeRunOptions
        );

    }


    handleMessage(event) {

        const data =
            event.data;

        if (!isObject(data)) {

            return;

        }


        const pending =
            this.pending.get(
                data.requestId
            );

        if (!pending) {

            return;

        }


        if (
            data.type ===
                "progress"
        ) {

            if (
                pending.token ===
                this.token
            ) {

                pending.onProgress?.({

                    phase:
                        data.phase,

                    progress:
                        data.progress,

                    token:
                        pending.token,

                    attempt:
                        pending.attempt

                });

            }

            return;

        }


        this.cleanupRequest(
            data.requestId,
            pending
        );


        if (
            data.type ===
                "result"
        ) {

            pending.resolve(
                data.result
            );

            return;

        }


        if (
            data.type ===
                "cancelled"
        ) {

            pending.reject(
                createAbortError(
                    "Worker analysis cancelled."
                )
            );

            return;

        }


        if (
            data.type ===
                "error"
        ) {

            pending.reject(
                createWorkerError(
                    data.error
                )
            );

        }

    }


    handleWorkerFailure(event) {

        const error =
            event?.error ??
            new Error(
                event?.message ??
                "Analysis Worker failed."
            );


        this.lastError =
            error;


        for (
            const [
                requestId,
                pending
            ] of [
                ...this.pending
            ]
        ) {

            this.cleanupRequest(
                requestId,
                pending
            );

            pending.reject(
                error
            );

        }


        this.releaseWorker();

    }


    cleanupRequest(
        requestId,
        pending
    ) {

        pending.signal
            ?.removeEventListener(
                "abort",
                pending.abort
            );

        this.pending.delete(
            requestId
        );

    }


    cancel(
        requestId,
        reason =
            createAbortError(
                "Analysis cancelled."
            )
    ) {

        const pending =
            this.pending.get(
                requestId
            );

        if (!pending) {

            return false;

        }


        try {

            this.worker?.postMessage({

                type:
                    "cancel",

                requestId

            });

        }
        catch {

            // worker may already be unavailable
        }


        this.cleanupRequest(
            requestId,
            pending
        );

        pending.reject(
            reason
        );

        return true;

    }


    cancelPending(reason) {

        for (
            const requestId of
            [
                ...this.pending
                    .keys()
            ]
        ) {

            this.cancel(
                requestId,
                reason
            );

        }

        return this;

    }


    cancelDebounced(reason) {

        if (!this.debounceEntry) {

            return this;

        }


        clearTimeout(
            this.debounceEntry
                .timer
        );

        this.debounceEntry
            .reject(
                reason
            );

        this.debounceEntry =
            null;

        return this;

    }


    cancelAll(
        reason =
            createAbortError(
                "All analyses cancelled."
            )
    ) {

        this.cancelDebounced(
            reason
        );

        this.cancelPending(
            reason
        );

        return this;

    }


    commitResult(
        token,
        result,
        engine
    ) {

        if (
            token <
            this.latestCommittedToken
        ) {

            return false;

        }


        this.latestCommittedToken =
            token;

        this.lastEngine =
            engine;

        this.lastResult =
            result;

        this.lastError =
            null;

        return true;

    }


    setCache(
        key,
        result
    ) {

        this.cache.delete(
            key
        );

        this.cache.set(
            key,
            clonePlainData(
                result
            )
        );


        while (
            this.cache.size >
            this.options.cacheSize
        ) {

            const oldest =
                this.cache
                    .keys()
                    .next()
                    .value;

            this.cache.delete(
                oldest
            );

        }

    }


    touchCache(
        key,
        result
    ) {

        this.cache.delete(
            key
        );

        this.cache.set(
            key,
            clonePlainData(
                result
            )
        );

    }


    clearCache() {

        this.cache.clear();

        return this;

    }


    releaseWorker() {

        if (!this.worker) {

            return this;

        }


        this.worker.removeEventListener(
            "message",
            this.boundMessage
        );

        this.worker.removeEventListener(
            "error",
            this.boundError
        );

        this.worker.removeEventListener(
            "messageerror",
            this.boundError
        );

        this.worker.terminate();

        this.worker =
            null;

        return this;

    }


    destroy() {

        if (this.destroyed) {

            return this;

        }


        this.cancelAll();

        this.releaseWorker();

        this.clearCache();

        this.destroyed =
            true;

        return this;

    }


    get activeCount() {

        return (
            this.pending.size +
            (
                this.debounceEntry
                    ? 1
                    : 0
            )
        );

    }


    get summary() {

        return {

            version:
                WORKER_ANALYZER_VERSION,

            engine:
                this.lastEngine,

            workerActive:
                Boolean(
                    this.worker
                ),

            activeCount:
                this.activeCount,

            cacheSize:
                this.cache.size,

            latestToken:
                this.token,

            committedToken:
                this.latestCommittedToken,

            fallback:
                this.options.fallback,

            retryCount:
                this.options.retryCount,

            debounceMs:
                this.options.debounceMs,

            destroyed:
                this.destroyed,

            error:
                this.lastError
                    ?.message ??
                null

        };

    }

}
