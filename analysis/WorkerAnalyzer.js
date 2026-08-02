/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * analysis/WorkerAnalyzer.js
 *
 * Analyzer Web Worker 包裝器。
 *
 * Dashboard／Game 可使用：
 *
 * const workerAnalyzer =
 *     new WorkerAnalyzer();
 *
 * const result =
 *     await workerAnalyzer.analyze({
 *         shoe,
 *         roundCount,
 *         runOptions
 *     });
 */

function isObject(value) {

    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );

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
            }

    } = {}) {

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
                workerURL,
                workerOptions
            );

        this.pending =
            new Map();

        this.destroyed =
            false;


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

    }


    analyze({

        shoe,

        roundCount = 0,

        historyCount =
            roundCount,

        contextOptions = {},

        runOptions = {},

        onProgress = null,

        signal = null

    } = {}) {

        if (
            this.destroyed
        ) {

            return Promise.reject(
                new Error(
                    "WorkerAnalyzer has been destroyed."
                )
            );

        }


        if (
            !shoe ||
            typeof shoe.toJSON !==
                "function"
        ) {

            return Promise.reject(
                new TypeError(
                    "WorkerAnalyzer requires a Shoe with toJSON()."
                )
            );

        }


        if (
            !isObject(
                contextOptions
            ) ||
            !isObject(
                runOptions
            )
        ) {

            return Promise.reject(
                new TypeError(
                    "WorkerAnalyzer options must be objects."
                )
            );

        }


        const requestId =
            createRequestId();


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
                    signal?.aborted
                ) {

                    reject(
                        new DOMException(
                            "Analysis aborted.",
                            "AbortError"
                        )
                    );

                    return;

                }


                if (signal) {

                    signal.addEventListener(
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
                            typeof onProgress ===
                                "function"
                                ? onProgress
                                : null,

                        signal,

                        abort

                    }
                );


                this.worker.postMessage({

                    type:
                        "analyze",

                    requestId,

                    payload:
                        {

                            shoe:
                                shoe.toJSON(),

                            roundCount,

                            historyCount,

                            contextOptions,

                            runOptions

                        }

                });

            }
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
            ] of this.pending
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

        for (
            const [
                requestId,
                pending
            ] of this.pending
        ) {

            this.cleanupRequest(
                requestId,
                pending
            );

            pending.reject(
                error
            );

        }

    }


    destroy() {

        if (
            this.destroyed
        ) {

            return this;

        }

        this.cancelAll();

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

        this.destroyed =
            true;

        return this;

    }


    get activeCount() {

        return this.pending.size;

    }

}
