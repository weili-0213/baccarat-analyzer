/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * tests/workerAnalyzer.test.js
 *
 * 驗證 analysis/WorkerAnalyzer.js：
 *
 * - Game 相容介面
 * - Worker 背景分析
 * - Progress 回報
 * - Worker 錯誤
 * - 主執行緒 fallback
 * - setContext() + analyze()
 * - cancelAll()
 * - destroy()
 */

import WorkerAnalyzer
    from "../analysis/WorkerAnalyzer.js";


function assert(
    condition,
    message
) {

    if (!condition) {

        throw new Error(
            message
        );

    }

}


function assertThrows(
    callback,
    message
) {

    let error =
        null;

    try {

        callback();

    }
    catch (caught) {

        error =
            caught;

    }

    assert(
        error instanceof Error,
        message
    );

    return error;

}


async function assertRejects(
    promise,
    message
) {

    let error =
        null;

    try {

        await promise;

    }
    catch (caught) {

        error =
            caught;

    }

    assert(
        error instanceof Error,
        message
    );

    return error;

}


function nextTick() {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                0
            )
    );

}


function createShoeMock() {

    return {

        toJSON() {

            return {

                deckCount:
                    8,

                cards:
                    [],

                discarded:
                    [],

                burned:
                    [],

                unknownBurnedCount:
                    0

            };

        }

    };

}


function createContext() {

    return {

        shoe:
            createShoeMock(),

        history:
            {

                count:
                    3

            },

        roundCount:
            3,

        payouts:
            {

                banker:
                    0.95

            },

        monteCarloOptions:
            {

                simulations:
                    1000

            },

        exactOptions:
            {},

        kellyOptions:
            {},

        riskOptions:
            {},

        confidenceOptions:
            {},

        rankingOptions:
            {},

        recommendationOptions:
            {},

        bankroll:
            10000,

        minBet:
            100,

        maxBet:
            10000,

        analyzerOptions:
            {

                mode:
                    "monteCarlo"

            }

    };

}


class FakeWorker {

    static instances = [];

    constructor(
        url,
        options
    ) {

        this.url =
            url;

        this.options =
            options;

        this.listeners =
            new Map();

        this.messages =
            [];

        this.terminated =
            false;

        FakeWorker.instances
            .push(
                this
            );

    }


    addEventListener(
        name,
        callback
    ) {

        if (
            !this.listeners.has(
                name
            )
        ) {

            this.listeners.set(
                name,
                new Set()
            );

        }

        this.listeners
            .get(name)
            .add(callback);

    }


    removeEventListener(
        name,
        callback
    ) {

        this.listeners
            .get(name)
            ?.delete(callback);

    }


    emit(
        name,
        data
    ) {

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

        const {
            requestId
        } =
            message;

        queueMicrotask(
            () => {

                this.emit(
                    "message",
                    {

                        type:
                            "progress",

                        requestId,

                        phase:
                            "monteCarlo",

                        progress:
                            {

                                completed:
                                    500,

                                total:
                                    1000,

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

                        requestId,

                        result:
                            {

                                method:
                                    "monteCarlo",

                                shouldBet:
                                    false,

                                generatedAfterRound:
                                    3

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


class ErrorWorker
    extends FakeWorker {

    postMessage(message) {

        this.messages.push(
            message
        );

        queueMicrotask(
            () => {

                this.emit(
                    "message",
                    {

                        type:
                            "error",

                        requestId:
                            message.requestId,

                        error:
                            {

                                name:
                                    "WorkerAnalysisError",

                                message:
                                    "Worker failed"

                            }

                    }
                );

            }
        );

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


class FallbackAnalyzerMock {

    constructor() {

        this.calls =
            0;

        this.lastContext =
            null;

        this.lastOptions =
            null;

    }


    analyzeContext(
        context,
        runOptions
    ) {

        this.calls++;

        this.lastContext =
            context;

        this.lastOptions =
            runOptions;

        return Promise.resolve({

            method:
                "fallback",

            shouldBet:
                false,

            generatedAfterRound:
                context.roundCount

        });

    }

}


export default async function workerAnalyzerTest() {

    const messages = [];

    const OriginalWorker =
        globalThis.Worker;


    try {

        /**
         * 1. 建構與介面。
         */
        globalThis.Worker =
            FakeWorker;

        const analyzer =
            new WorkerAnalyzer({

                lazy:
                    true

            });

        assert(
            typeof analyzer
                .analyzeContext ===
                "function",
            "缺少 analyzeContext()"
        );

        assert(
            typeof analyzer.run ===
                "function",
            "缺少 run()"
        );

        assert(
            typeof analyzer.setContext ===
                "function",
            "缺少 setContext()"
        );

        assert(
            typeof analyzer.analyze ===
                "function",
            "缺少 analyze()"
        );

        assert(
            analyzer.worker ===
                null,
            "lazy=true 時不應立即建立 Worker"
        );

        messages.push(
            "✓ Game 相容介面正確"
        );


        /**
         * 2. 參數驗證。
         */
        await assertRejects(
            analyzer.analyzeContext(
                null
            ),
            "非法 context 應拒絕"
        );

        await assertRejects(
            analyzer.analyzeContext(
                {}
            ),
            "缺少 Shoe 應拒絕"
        );

        assertThrows(
            () =>
                analyzer.setContext(
                    null
                ),
            "setContext() 非物件應拋錯"
        );

        messages.push(
            "✓ 參數驗證正確"
        );


        /**
         * 3. Worker 分析與進度。
         */
        let progressEvent =
            null;

        const result =
            await analyzer
                .analyzeContext(
                    createContext(),
                    {

                        mode:
                            "monteCarlo",

                        onProgress:
                            progress => {

                                progressEvent =
                                    progress;

                            }

                    }
                );

        assert(
            analyzer.worker instanceof
                FakeWorker,
            "應建立 Worker"
        );

        assert(
            result.method ===
                "monteCarlo",
            "Worker result 錯誤"
        );

        assert(
            result.generatedAfterRound ===
                3,
            "Worker result 局數錯誤"
        );

        assert(
            progressEvent?.phase ===
                "monteCarlo",
            "Progress phase 錯誤"
        );

        assert(
            progressEvent
                ?.progress
                ?.ratio ===
                0.5,
            "Progress ratio 錯誤"
        );

        assert(
            analyzer.lastEngine ===
                "worker",
            "成功後 engine 應為 worker"
        );

        assert(
            analyzer.activeCount ===
                0,
            "完成後 pending 應清空"
        );

        messages.push(
            "✓ Worker 分析與 Progress 正確"
        );


        /**
         * 4. 傳送資料格式。
         */
        const sent =
            analyzer.worker
                .messages[0];

        assert(
            sent.type ===
                "analyze",
            "Worker message type 錯誤"
        );

        assert(
            sent.payload
                .roundCount ===
                3,
            "roundCount 未傳入 Worker"
        );

        assert(
            sent.payload
                .historyCount ===
                3,
            "historyCount 未傳入 Worker"
        );

        assert(
            sent.payload
                .contextOptions
                .minBet ===
                100,
            "minBet 未傳入 Worker"
        );

        assert(
            sent.payload
                .contextOptions
                .maxBet ===
                10000,
            "maxBet 未傳入 Worker"
        );

        assert(
            !(
                "onProgress" in
                sent.payload
                    .runOptions
            ),
            "函式不可傳入 Worker"
        );

        messages.push(
            "✓ Worker payload 正確"
        );


        /**
         * 5. run() 別名。
         */
        const runResult =
            await analyzer.run(
                createContext(),
                {}
            );

        assert(
            runResult.method ===
                "monteCarlo",
            "run() 未代理 analyzeContext()"
        );

        messages.push(
            "✓ run() 別名正確"
        );


        /**
         * 6. setContext() + analyze()。
         */
        analyzer.setContext(
            createContext()
        );

        const analyzeResult =
            await analyzer.analyze({

                mode:
                    "monteCarlo"

            });

        assert(
            analyzeResult.method ===
                "monteCarlo",
            "setContext() + analyze() 錯誤"
        );

        messages.push(
            "✓ setContext() + analyze() 正確"
        );


        /**
         * 7. Worker 錯誤後 fallback。
         */
        analyzer.destroy();

        globalThis.Worker =
            ErrorWorker;

        const fallback =
            new FallbackAnalyzerMock();

        const fallbackAdapter =
            new WorkerAnalyzer({

                fallback:
                    true,

                fallbackAnalyzer:
                    fallback,

                lazy:
                    true

            });

        const fallbackResult =
            await fallbackAdapter
                .analyzeContext(
                    createContext(),
                    {

                        mode:
                            "exact"

                    }
                );

        assert(
            fallback.calls ===
                1,
            "Worker 失敗後未呼叫 fallback Analyzer"
        );

        assert(
            fallbackResult.method ===
                "fallback",
            "Fallback result 錯誤"
        );

        assert(
            fallbackAdapter
                .lastEngine ===
                "main",
            "Fallback 後 engine 應為 main"
        );

        messages.push(
            "✓ Worker 失敗 fallback 正確"
        );


        /**
         * 8. fallback=false。
         */
        const noFallback =
            new WorkerAnalyzer({

                fallback:
                    false,

                lazy:
                    true

            });

        const workerError =
            await assertRejects(
                noFallback
                    .analyzeContext(
                        createContext()
                    ),
                "fallback=false 時應拋出 Worker 錯誤"
            );

        assert(
            workerError.message ===
                "Worker failed",
            "Worker 錯誤訊息錯誤"
        );

        noFallback.destroy();

        messages.push(
            "✓ fallback=false 正確"
        );


        /**
         * 9. cancelAll()。
         */
        globalThis.Worker =
            HangingWorker;

        const hanging =
            new WorkerAnalyzer({

                fallback:
                    false,

                lazy:
                    true

            });

        const hangingPromise =
            hanging.analyzeContext(
                createContext()
            );

        await nextTick();

        assert(
            hanging.activeCount ===
                1,
            "背景請求應為 pending"
        );

        hanging.cancelAll();

        const cancelError =
            await assertRejects(
                hangingPromise,
                "cancelAll() 應拒絕 pending request"
            );

        assert(
            cancelError.name ===
                "AbortError",
            "取消錯誤應為 AbortError"
        );

        assert(
            hanging.activeCount ===
                0,
            "cancelAll() 後 pending 應清空"
        );

        messages.push(
            "✓ cancelAll() 正確"
        );


        /**
         * 10. destroy()。
         */
        const hangingWorker =
            hanging.worker;

        hanging.destroy();

        assert(
            hanging.destroyed ===
                true,
            "destroyed 應為 true"
        );

        assert(
            hangingWorker
                .terminated ===
                true,
            "destroy() 應終止 Worker"
        );

        assert(
            hanging.worker ===
                null,
            "destroy() 後 worker 應為 null"
        );

        await assertRejects(
            hanging.analyzeContext(
                createContext()
            ),
            "destroy() 後不可再分析"
        );

        messages.push(
            "✓ destroy() 正確"
        );


        /**
         * 11. summary。
         */
        const summary =
            fallbackAdapter.summary;

        assert(
            summary &&
            typeof summary ===
                "object",
            "summary 應為物件"
        );

        assert(
            summary.engine ===
                "main",
            "summary.engine 錯誤"
        );

        assert(
            summary.fallback ===
                true,
            "summary.fallback 錯誤"
        );

        fallbackAdapter.destroy();

        messages.push(
            "✓ summary 正確"
        );


        return `
${messages.join("\n")}

WorkerAnalyzer 測試完成

背景 Worker：通過
Game 相容介面：通過
Progress：通過
Fallback：通過
取消請求：通過
資源釋放：通過
`;

    }
    finally {

        globalThis.Worker =
            OriginalWorker;

        FakeWorker.instances =
            [];

    }

}
