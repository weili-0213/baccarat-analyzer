/**
 * Baccarat Analyzer V3.4-1
 * tests/workerAnalyzer.test.js
 */

import WorkerAnalyzer, {
    WORKER_ANALYZER_VERSION
} from "../analysis/WorkerAnalyzer.js";


function assert(condition, message) {

    if (!condition) {

        throw new Error(message);

    }

}


async function assertRejects(
    promise,
    message
) {

    try {

        await promise;

    }
    catch (error) {

        return error;

    }

    throw new Error(message);

}


function tick(ms = 0) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


function createShoeMock(id = 1) {

    return {

        toJSON() {

            return {

                id,

                deckCount:
                    8,

                cards:
                    [],

                discarded:
                    [],

                burned:
                    []

            };

        }

    };

}


function context(id = 1) {

    return {

        shoe:
            createShoeMock(id),

        roundCount:
            id,

        history: {

            count:
                id

        },

        bankroll:
            10000,

        minBet:
            100,

        maxBet:
            10000

    };

}


class FakeWorker {

    constructor() {

        this.listeners =
            new Map();

        this.messages =
            [];

        this.terminated =
            false;

        this.resultCount =
            0;

    }


    addEventListener(name, callback) {

        if (!this.listeners.has(name)) {

            this.listeners.set(
                name,
                new Set()
            );

        }

        this.listeners
            .get(name)
            .add(callback);

    }


    removeEventListener(name, callback) {

        this.listeners
            .get(name)
            ?.delete(callback);

    }


    emit(name, data) {

        for (
            const callback of
            this.listeners
                .get(name) ??
            []
        ) {

            callback({

                data,

                message:
                    data?.message,

                error:
                    data?.error

            });

        }

    }


    postMessage(message) {

        this.messages.push(
            message
        );


        if (
            message.type ===
                "cancel"
        ) {

            return;

        }


        this.resultCount++;


        queueMicrotask(
            () => {

                this.emit(
                    "message",
                    {

                        type:
                            "progress",

                        requestId:
                            message.requestId,

                        phase:
                            "monteCarlo",

                        progress: {

                            ratio:
                                0.5

                        }

                    }
                );


                this.emit(
                    "message",
                    {

                        type:
                            "result",

                        requestId:
                            message.requestId,

                        result: {

                            generatedAfterRound:
                                message.payload
                                    .roundCount,

                            resultCount:
                                this.resultCount

                        }

                    }
                );

            }
        );

    }


    terminate() {

        this.terminated =
            true;

    }

}


class HangingWorker
    extends FakeWorker {

    postMessage(message) {

        this.messages.push(
            message
        );

    }

}


class ErrorWorker
    extends FakeWorker {

    postMessage(message) {

        this.messages.push(
            message
        );


        if (
            message.type ===
                "cancel"
        ) {

            return;

        }


        queueMicrotask(
            () =>
                this.emit(
                    "message",
                    {

                        type:
                            "error",

                        requestId:
                            message.requestId,

                        error: {

                            message:
                                "Worker failed"

                        }

                    }
                )
        );

    }

}


class FallbackAnalyzer {

    constructor() {

        this.calls =
            0;

    }


    analyzeContext(context) {

        this.calls++;

        return Promise.resolve({

            generatedAfterRound:
                context.roundCount,

            source:
                "fallback"

        });

    }

}


export default async function workerAnalyzerTest() {

    const messages =
        [];

    const OriginalWorker =
        globalThis.Worker;


    try {

        globalThis.Worker =
            FakeWorker;


        const analyzer =
            new WorkerAnalyzer({

                debounceMs:
                    0,

                retryCount:
                    0

            });


        assert(
            WORKER_ANALYZER_VERSION ===
                "3.4.1",
            "版本錯誤"
        );

        assert(
            typeof analyzer
                .analyzeContext ===
                "function" &&
            typeof analyzer.run ===
                "function" &&
            typeof analyzer.setContext ===
                "function" &&
            typeof analyzer.analyze ===
                "function",
            "Game 相容介面不完整"
        );

        messages.push(
            "✓ V3.4-1 介面正確"
        );


        let progress =
            null;

        const first =
            await analyzer
                .analyzeContext(
                    context(1),
                    {

                        onProgress:
                            value => {

                                progress =
                                    value;

                            }

                    }
                );


        assert(
            first.generatedAfterRound ===
                1,
            "Worker result 錯誤"
        );

        assert(
            progress?.phase ===
                "monteCarlo",
            "Progress 錯誤"
        );

        messages.push(
            "✓ Worker 與 Progress 正確"
        );


        const worker =
            analyzer.worker;

        const before =
            worker.resultCount;


        const cached =
            await analyzer
                .analyzeContext(
                    context(1)
                );


        assert(
            cached.generatedAfterRound ===
                1,
            "Cache result 錯誤"
        );

        assert(
            worker.resultCount ===
                before,
            "相同分析應使用 Cache"
        );

        assert(
            analyzer.lastEngine ===
                "cache",
            "Cache engine 狀態錯誤"
        );

        messages.push(
            "✓ LRU Cache 正確"
        );


        analyzer.destroy();


        globalThis.Worker =
            HangingWorker;


        const latest =
            new WorkerAnalyzer({

                debounceMs:
                    20,

                retryCount:
                    0,

                fallback:
                    false

            });


        const oldPromise =
            latest.analyzeContext(
                context(1)
            );

        const newPromise =
            latest.analyzeContext(
                context(2)
            );


        const oldError =
            await assertRejects(
                oldPromise,
                "舊 debounce 請求應取消"
            );


        assert(
            oldError.name ===
                "AbortError",
            "舊請求取消錯誤類型錯誤"
        );


        await tick(30);


        assert(
            latest.activeCount ===
                1,
            "最新請求應進入 Worker"
        );


        latest.cancelAll();


        const newError =
            await assertRejects(
                newPromise,
                "cancelAll 應取消最新請求"
            );


        assert(
            newError.name ===
                "AbortError",
            "cancelAll 錯誤類型錯誤"
        );

        messages.push(
            "✓ Debounce、latest-wins、Cancel 正確"
        );


        latest.destroy();


        globalThis.Worker =
            ErrorWorker;


        const fallback =
            new FallbackAnalyzer();

        const recovery =
            new WorkerAnalyzer({

                debounceMs:
                    0,

                retryCount:
                    1,

                fallback:
                    true,

                fallbackAnalyzer:
                    fallback

            });


        const recovered =
            await recovery
                .analyzeContext(
                    context(3)
                );


        assert(
            recovered.source ===
                "fallback",
            "Worker 失敗後未 fallback"
        );

        assert(
            fallback.calls ===
                1,
            "Fallback 呼叫次數錯誤"
        );

        assert(
            recovery.lastEngine ===
                "main",
            "Fallback engine 狀態錯誤"
        );

        messages.push(
            "✓ Retry 與 Fallback 正確"
        );


        const summary =
            recovery.summary;


        assert(
            summary.version ===
                "3.4.1" &&
            summary.retryCount ===
                1 &&
            summary.cacheSize ===
                1,
            "Summary 錯誤"
        );

        recovery.destroy();

        assert(
            recovery.destroyed ===
                true,
            "destroy 狀態錯誤"
        );

        messages.push(
            "✓ Summary 與 destroy 正確"
        );


        return `

${messages.join("\n")}

WorkerAnalyzer V3.4-1 測試完成

Debounce：通過
Latest wins：通過
Cache：通過
Token：通過
Progress：通過
Retry：通過
Fallback：通過

`;

    }
    finally {

        globalThis.Worker =
            OriginalWorker;

    }

}
