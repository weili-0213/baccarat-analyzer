/**
 * Baccarat Analyzer V3.4-1
 * workers/analyzer.worker.js
 *
 * Worker-side Analysis Runtime
 *
 * - Analyze
 * - Cancel acknowledgement
 * - Progress
 * - Token echo
 * - Analyzer instance cache
 */

import Analyzer
    from "../analysis/analyzer.js";

import Shoe
    from "../engine/shoe.js";


export const ANALYZER_WORKER_VERSION =
    "3.4.1";


const cancelled =
    new Set();

const analyzerCache =
    new Map();

const MAX_ANALYZER_CACHE =
    4;


function isObject(value) {

    return (
        value !== null &&
        typeof value ===
            "object" &&
        !Array.isArray(value)
    );

}


function serializeError(error) {

    return {

        name:
            error?.name ??
            "Error",

        message:
            error?.message ??
            String(error),

        stack:
            error?.stack ??
            null

    };

}


function createHistoryMock(count = 0) {

    return {

        count:
            Number.isInteger(
                count
            ) &&
            count >= 0
                ? count
                : 0

    };

}


function createProgressHandler(
    requestId,
    token,
    phase
) {

    return progress => {

        if (
            cancelled.has(
                requestId
            )
        ) {

            return;

        }


        self.postMessage({

            type:
                "progress",

            requestId,

            token,

            phase,

            progress

        });

    };

}


function createAnalyzerKey(
    contextOptions = {}
) {

    return JSON.stringify({

        payouts:
            contextOptions.payouts ??
            {},

        analyzerOptions:
            contextOptions
                .analyzerOptions ??
            {},

        recommendationOptions:
            contextOptions
                .recommendationOptions ??
            {}

    });

}


function getAnalyzer(
    context,
    key
) {

    if (
        analyzerCache.has(
            key
        )
    ) {

        const analyzer =
            analyzerCache.get(
                key
            );

        analyzerCache.delete(
            key
        );

        analyzerCache.set(
            key,
            analyzer
        );

        analyzer.setContext(
            context
        );

        return analyzer;

    }


    const analyzer =
        new Analyzer(
            context
        );


    analyzerCache.set(
        key,
        analyzer
    );


    while (
        analyzerCache.size >
        MAX_ANALYZER_CACHE
    ) {

        const oldest =
            analyzerCache
                .keys()
                .next()
                .value;

        analyzerCache.delete(
            oldest
        );

    }


    return analyzer;

}


async function runAnalysis(
    requestId,
    token,
    payload
) {

    if (!isObject(payload)) {

        throw new TypeError(
            "Worker analysis payload must be an object."
        );

    }


    if (!isObject(payload.shoe)) {

        throw new Error(
            "Worker analysis requires serialized Shoe data."
        );

    }


    const shoe =
        Shoe.fromJSON(
            payload.shoe
        );


    const roundCount =
        Number.isInteger(
            payload.roundCount
        )
            ? payload.roundCount
            : (
                Number.isInteger(
                    payload.historyCount
                )
                    ? payload.historyCount
                    : 0
            );


    const contextOptions =
        isObject(
            payload.contextOptions
        )
            ? payload.contextOptions
            : {};


    const context = {

        shoe,

        history:
            createHistoryMock(
                payload.historyCount ??
                roundCount
            ),

        roundCount,

        ...contextOptions

    };


    const runOptions = {

        ...(
            isObject(
                payload.runOptions
            )
                ? payload.runOptions
                : {}
        ),

        onMonteCarloProgress:
            createProgressHandler(
                requestId,
                token,
                "monteCarlo"
            ),

        onExactProgress:
            createProgressHandler(
                requestId,
                token,
                "exact"
            )

    };


    const key =
        createAnalyzerKey(
            contextOptions
        );

    const analyzer =
        getAnalyzer(
            context,
            key
        );


    const result =
        await analyzer.analyze(
            runOptions
        );


    if (
        cancelled.has(
            requestId
        )
    ) {

        return null;

    }


    return result;

}


self.addEventListener(
    "message",
    async event => {

        const data =
            event.data;


        if (!isObject(data)) {

            return;

        }


        if (
            data.type ===
                "cancel"
        ) {

            cancelled.add(
                data.requestId
            );


            self.postMessage({

                type:
                    "cancelled",

                requestId:
                    data.requestId,

                token:
                    data.token ??
                    null

            });

            return;

        }


        if (
            data.type !==
                "analyze"
        ) {

            return;

        }


        const requestId =
            data.requestId;

        const token =
            data.token ??
            0;


        cancelled.delete(
            requestId
        );


        try {

            const result =
                await runAnalysis(
                    requestId,
                    token,
                    data.payload
                );


            if (
                result ===
                    null ||
                cancelled.has(
                    requestId
                )
            ) {

                self.postMessage({

                    type:
                        "cancelled",

                    requestId,

                    token

                });

                return;

            }


            self.postMessage({

                type:
                    "result",

                requestId,

                token,

                result

            });

        }
        catch (error) {

            if (
                cancelled.has(
                    requestId
                )
            ) {

                self.postMessage({

                    type:
                        "cancelled",

                    requestId,

                    token

                });

                return;

            }


            self.postMessage({

                type:
                    "error",

                requestId,

                token,

                error:
                    serializeError(
                        error
                    )

            });

        }
        finally {

            cancelled.delete(
                requestId
            );

        }

    }
);
