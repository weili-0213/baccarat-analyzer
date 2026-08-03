/**
 * Baccarat Analyzer V3.5
 * analysis/pipeline/EVPipeline.js
 *
 * 第一批 Analyzer Pipeline：
 * - 讀取 state.probability
 * - 呼叫 EV Engine
 * - 略過缺少機率或缺少方法的下注項目
 * - 輸出 ev 與 evStatus
 */

export const EV_PIPELINE_VERSION =
    "3.5.0";


function isObject(value) {

    return (
        value !== null &&
        typeof value ===
            "object" &&
        !Array.isArray(value)
    );

}


export default class EVPipeline {

    constructor({

        engine,

        betConfig

    } = {}) {

        if (!engine) {

            throw new Error(
                "EVPipeline requires an EV engine."
            );

        }


        if (!isObject(betConfig)) {

            throw new TypeError(
                "EVPipeline requires betConfig."
            );

        }


        this.engine =
            engine;

        this.betConfig =
            betConfig;

    }


    run({

        state

    }) {

        const probability =
            state.probability;


        if (!isObject(probability)) {

            throw new Error(
                "EVPipeline requires state.probability."
            );

        }


        const ev =
            {};

        const evStatus =
            {};


        for (
            const name of
            Object.keys(
                this.betConfig
            )
        ) {

            if (
                !Number.isFinite(
                    probability[name]
                )
            ) {

                continue;

            }


            const method =
                this.engine[name];


            if (
                typeof method !==
                    "function"
            ) {

                continue;

            }


            const value =
                method.call(
                    this.engine,
                    probability
                );


            if (
                !Number.isFinite(
                    value
                )
            ) {

                throw new TypeError(
                    `EV result for ${name} must be a finite number.`
                );

            }


            ev[name] =
                value;


            if (
                this.engine.status &&
                name in
                    this.engine.status
            ) {

                evStatus[name] =
                    this.engine
                        .status[name];

            }

        }


        return {

            ev,

            evStatus

        };

    }


    toDefinition({

        name =
            "ev",

        priority =
            20,

        probabilityKey =
            "probability"

    } = {}) {

        return {

            name,

            priority,

            requires:
                [
                    probabilityKey
                ],

            run:
                context =>
                    this.run(
                        context
                    ),

            metadata: {

                version:
                    EV_PIPELINE_VERSION,

                type:
                    "ev"

            }

        };

    }


    get summary() {

        return {

            version:
                EV_PIPELINE_VERSION,

            bets:
                Object.keys(
                    this.betConfig
                ).length,

            hasStatus:
                isObject(
                    this.engine.status
                )

        };

    }

}
