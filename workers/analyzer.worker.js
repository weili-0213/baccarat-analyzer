/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * workers/analyzer.worker.js
 *
 * 在 Web Worker 中執行 Analyzer，
 * 避免 Monte Carlo／Exact 阻塞 Dashboard。
 *
 * 收到：
 *
 * {
 *   type: "analyze",
 *   requestId,
 *   payload: {
 *     shoe,
 *     roundCount,
 *     historyCount,
 *     contextOptions,
 *     runOptions
 *   }
 * }
 *
 * 回傳：
 *
 * {
 *   type: "result" | "error" | "progress",
 *   requestId,
 *   ...
 * }
 */

import Analyzer
    from "../analysis/analyzer.js";

import Shoe
    from "../engine/shoe.js";


function isObject(value) {

    return (
        value !== null &&
        typeof value === "object" &&
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


function createHistoryMock(
    count = 0
) {

    const normalized =
        Number.isInteger(count) &&
        count >= 0
            ? count
            : 0;

    return {

        count:
            normalized

    };

}


function createProgressHandler(
    requestId,
    phase
) {

    return progress => {

        self.postMessage({

            type:
                "progress",

            requestId,

            phase,

            progress

        });

    };

}


async function analyze(
    requestId,
    payload
) {

    if (
        !isObject(payload)
    ) {

        throw new TypeError(
            "Worker analysis payload must be an object."
        );

    }


    const shoeData =
        payload.shoe;

    if (
        !isObject(shoeData)
    ) {

        throw new Error(
            "Worker analysis requires serialized Shoe data."
        );

    }


    const shoe =
        Shoe.fromJSON(
            shoeData
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


    const context = {

        shoe,

        history:
            createHistoryMock(
                payload.historyCount ??
                roundCount
            ),

        roundCount,

        ...(
            isObject(
                payload.contextOptions
            )
                ? payload.contextOptions
                : {}
        )

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
                "monteCarlo"
            ),

        onExactProgress:
            createProgressHandler(
                requestId,
                "exact"
            )

    };


    const analyzer =
        new Analyzer(
            context
        );


    return analyzer
        .analyze(
            runOptions
        );

}


self.addEventListener(
    "message",
    async event => {

        const data =
            event.data;

        if (
            !isObject(data) ||
            data.type !==
                "analyze"
        ) {

            return;

        }


        const requestId =
            data.requestId;


        try {

            const result =
                await analyze(
                    requestId,
                    data.payload
                );


            self.postMessage({

                type:
                    "result",

                requestId,

                result

            });

        }
        catch (error) {

            self.postMessage({

                type:
                    "error",

                requestId,

                error:
                    serializeError(
                        error
                    )

            });

        }

    }
);
