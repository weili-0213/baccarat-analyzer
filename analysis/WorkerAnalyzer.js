/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * analysis/WorkerAnalyzer.js
 *
 * Game 相容的背景分析器 Adapter。
 *
 * 介面：
 *
 * - analyzeContext(context, runOptions)
 * - run(context, runOptions)
 * - setContext(context)
 * - analyze(runOptions)
 *
 * engine/game.js 不需要修改。
 *
 * Game 只要注入：
 *
 * new Game({
 *     analyzer: new WorkerAnalyzer()
 * })
 *
 * 瀏覽器無 Worker、Worker 啟動失敗或背景分析失敗時，
 * 可自動退回主執行緒 Analyzer。
 */

import Analyzer
    from "./analyzer.js";


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

            // 改用 JSON 備援。
        }

    }

    try {

        return JSON.parse(
            JSON.stringify(value)
        );

    }
    catch {

        return value;

    }

}


function createRequestId() {

    if (
        globalThis.crypto &&
        typeof globalThis.crypto
            .randomUUID ===
            "function"
    ) {

        return globalThis.crypto
            .randomUUID();

    }

    return (
        `analysis-${Date.now()}-` +
        Math.random()
            .toString(36)
            .slice(2)
    );

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

    if (
        data?.stack
    ) {

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

        fallback =
            true,

        fallbackAnalyzer =
            null,

        lazy =
            true

    } = {}) {

        this.workerURL =
            workerURL;

        this.workerOptions = {

            ...workerOptions

        };

        this.fallback =
            Boolean(
                fallback
            );

        this.fallbackAnalyzer =
            fallbackAnalyzer ??
            new Analyzer();

        this.lazy =
            Boolean(
                lazy
            );

        this.worker =
            null;

        this.pending =
            new Map();

        this.context =
            null;

        this.destroyed =
            false;

        this.lastEngine =
            "none";

        this.lastError =
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


        if (!this.lazy) {

            this.ensureWorker();

        }

    }


    /**
     * Game 相容正式入口。
     */
    async analyzeContext(
        context = {},
        runOptions = {}
    ) {

        if (
            !isObject(context)
        ) {

            throw new TypeError(
                "WorkerAnalyzer context must be an object."
            );

        }

        if (!context.shoe) {

            throw new Error(
                "WorkerAnalyzer context requires a Shoe."
            );

        }

        if (
            !isObject(runOptions)
        ) {

            throw new TypeError(
                "WorkerAnalyzer runOptions must be an object."
            );

        }


        this.context =
            context;

        this.lastError =
            null;


        try {

            const result =
                await this.analyzeInWorker(
                    context,
                    runOptions
                );

            this.lastEngine =
                "worker";

            return result;

        }
        catch (error) {

            this.lastError =
                error;

            if (
                error?.name ===
                    "AbortError"
            ) {

                throw error;

            }

            if (!this.fallback) {

                throw error;

            }

            console.warn(
                "Worker analysis unavailable; falling back to main-thread Analyzer.",
                error
            );

            this.lastEngine =
                "main";

            return this
                .analyzeOnMainThread(
                    context,
                    runOptions
                );

        }

    }


    /**
     * Game 支援的 run() 別名。
     */
    run(
        context = {},
        runOptions = {}
    ) {

        return this.analyzeContext(
            context,
            runOptions
        );

    }


    /**
     * 支援 setContext() + analyze() 介面。
     */
    setContext(context = {}) {

        if (
            !isObject(context)
        ) {

            throw new TypeError(
                "WorkerAnalyzer context must be an object."
            );

        }

        this.context =
            context;

        return this;

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


    ensureWorker() {

        if (
            this.destroyed
        ) {

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


        const worker =
            new Worker(
                this.workerURL,
                this.workerOptions
            );

        worker.addEventListener(
            "message",
            this.boundMessage
        );

        worker.addEventListener(
            "error",
            this.boundError
        );

        worker.addEventListener(
            "messageerror",
            this.boundError
        );

        this.worker =
            worker;

        return worker;

    }


    /**
     * 將 Game context 整理成 Worker 可 structured-clone 的資料。
     */
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
            ...serializableRunOptions
        } = runOptions;


        const analyzerOptions =
            context.analyzerOptions ??
            {};


        return {

            payload:
                {

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
                        {

                            payouts:
                                clonePlainData(
                                    context.payouts ??
                                    {}
                                ),

                            monteCarloOptions:
                                clonePlainData(
                                    context
                                        .monteCarloOptions ??
                                    {}
                                ),

                            exactOptions:
                                clonePlainData(
                                    context
                                        .exactOptions ??
                                    {}
                                ),

                            kellyOptions:
                                clonePlainData(
                                    context
                                        .kellyOptions ??
                                    {}
                                ),

                            riskOptions:
                                clonePlainData(
                                    context
                                        .riskOptions ??
                                    {}
                                ),

                            confidenceOptions:
                                clonePlainData(
                                    context
                                        .confidenceOptions ??
                                    {}
                                ),

                            rankingOptions:
                                clonePlainData(
                                    context
                                        .rankingOptions ??
                                    {}
                                ),

                            recommendationOptions:
                                clonePlainData(
                                    context
                                        .recommendationOptions ??
                                    {}
                                ),

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
                                clonePlainData(
                                    analyzerOptions
                                )

                        },

                    runOptions:
                        clonePlainData(
                            serializableRunOptions
                        )

                },

            signal:
                signal ??
                null,

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
                                    progress.progress
                                );

                        }

                        if (
                            progress.phase ===
                                "exact"
                        ) {

                            onExactProgress
                                ?.(
                                    progress.progress
                                );

                        }

                    }

        };

    }


    analyzeInWorker(
        context,
        runOptions
    ) {

        const worker =
            this.ensureWorker();

        const requestId =
            createRequestId();

        const prepared =
            this.createWorkerPayload(
                context,
                runOptions
            );


        return new Promise(
            (
                resolve,
                reject
            ) => {

                const abort =
                    () => {

                        this.cancel(
                            requestId,
                            new DOMException(
                                "Analysis aborted.",
                                "AbortError"
                            )
                        );

                    };


                if (
                    prepared.signal
                        ?.aborted
                ) {

                    reject(
                        new DOMException(
                            "Analysis aborted.",
                            "AbortError"
                        )
                    );

                    return;

                }


                if (
                    prepared.signal
                ) {

                    prepared.signal
                        .addEventListener(
                            "abort",
                            abort,
                            {
                                once:
                                    true
                            }
                        );

                }


                this.pending.set(
                    requestId,
                    {

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

                    payload:
                        prepared.payload

                });

            }
        );

    }


    analyzeOnMainThread(
        context,
        runOptions
    ) {

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
                    runOptions
                );

        }


        if (
            typeof analyzer.run ===
                "function"
        ) {

            return analyzer.run(
                context,
                runOptions
            );

        }


        if (
            typeof analyzer
                .setContext ===
                "function" &&
            typeof analyzer
                .analyze ===
                "function"
        ) {

            analyzer.setContext(
                context
            );

            return analyzer.analyze(
                runOptions
            );

        }


        throw new TypeError(
            "Fallback Analyzer does not provide a supported interface."
        );

    }


    handleMessage(event) {

        const data =
            event.data;

        if (
            !isObject(data)
        ) {

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

            pending.onProgress?.({

                phase:
                    data.phase,

                progress:
                    data.progress

            });

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
                "error"
        ) {

            pending.reject(
                createWorkerError(
                    data.error
                )
            );

        }

    }


    cleanupRequest(
        requestId,
        pending
    ) {

        if (
            pending.signal
        ) {

            pending.signal
                .removeEventListener(
                    "abort",
                    pending.abort
                );

        }

        this.pending.delete(
            requestId
        );

    }


    cancel(
        requestId,
        reason =
            new DOMException(
                "Analysis cancelled.",
                "AbortError"
            )
    ) {

        const pending =
            this.pending.get(
                requestId
            );

        if (!pending) {

            return false;

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


    cancelAll(
        reason =
            new DOMException(
                "All analyses cancelled.",
                "AbortError"
            )
    ) {

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
                reason
            );

        }

        return this;

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

        if (
            this.destroyed
        ) {

            return this;

        }

        this.cancelAll();

        this.releaseWorker();

        this.destroyed =
            true;

        return this;

    }


    get activeCount() {

        return this.pending.size;

    }


    get summary() {

        return {

            engine:
                this.lastEngine,

            workerActive:
                Boolean(
                    this.worker
                ),

            activeCount:
                this.activeCount,

            fallback:
                this.fallback,

            destroyed:
                this.destroyed,

            error:
                this.lastError
                    ?.message ??
                null

        };

    }

}
