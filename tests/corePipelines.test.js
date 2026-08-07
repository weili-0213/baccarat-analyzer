/**
 * Baccarat Analyzer V3.5
 * tests/corePipelines.test.js
 */

import PipelineManager
    from "../analysis/pipeline/PipelineManager.js";

import ProbabilityPipeline, {
    PROBABILITY_PIPELINE_VERSION
} from "../analysis/pipeline/ProbabilityPipeline.js";

import EVPipeline, {
    EV_PIPELINE_VERSION
} from "../analysis/pipeline/EVPipeline.js";

import EV
    from "../analysis/ev.js";


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


async function assertRejects(
    callback,
    message
) {

    try {

        await callback();

    }
    catch (error) {

        return error;

    }


    throw new Error(
        message
    );

}


const BET_CONFIG = {

    player:
        {},

    banker:
        {},

    tie:
        {},

    playerPair:
        {},

    bankerPair:
        {},

    super6:
        {},

    playerDragonBonus:
        {},

    bankerDragonBonus:
        {}

};


export default async function corePipelinesTest() {

    const messages =
        [];


    assert(
        PROBABILITY_PIPELINE_VERSION ===
            "3.5.0" &&
        EV_PIPELINE_VERSION ===
            "3.5.0",
        "Core Pipeline 版本錯誤"
    );

    messages.push(
        "✓ V3.5 Core Pipeline 版本正確"
    );


    const probabilityPipeline =
        new ProbabilityPipeline({

            supportedKeys:
                Object.keys(
                    BET_CONFIG
                )

        });


    const evEngine =
        new EV();


    const evPipeline =
        new EVPipeline({

            engine:
                evEngine,

            betConfig:
                BET_CONFIG

        });


    const manager =
        new PipelineManager({

            pipelines:
                [

                    probabilityPipeline
                        .toDefinition(),

                    evPipeline
                        .toDefinition()

                ]

        });


    const result =
        await manager.run({

            runOptions: {

                probability: {

                    player:
                        0.446,

                    banker:
                        0.458,

                    tie:
                        0.096,

                    playerPair:
                        0.074,

                    bankerPair:
                        0.075,

                    super6:
                        0.054,

                    playerDragonBonus:
                        0.03,

                    bankerDragonBonus:
                        0.032

                }

            }

        });


    assert(
        result.execution[0]
            .name ===
            "probability" &&
        result.execution[1]
            .name ===
            "ev",
        "Core Pipeline 順序錯誤"
    );


    assert(
        result.state
            .method ===
            "provided",
        "Provided probability method 錯誤"
    );


    assert(
        Math.abs(
            result.state.ev
                .player -
            (
                0.446 -
                0.458
            )
        ) < 1e-12,
        "Player EV 錯誤"
    );


    assert(
        Math.abs(
            result.state.ev
                .banker -
            (
                (0.458 - 0.054) *
                    1 +
                0.054 *
                    0.5 -
                0.446
            )
        ) < 1e-12,
        "免佣 Banker EV（莊6半賠）錯誤"
    );


    assert(
        result.state
            .evStatus
            .playerDragonBonus ===
            "unavailable",
        "Dragon Bonus EV 狀態錯誤"
    );


    assert(
        result.state.ev
            .playerDragonBonus ===
            0 &&
        result.state.ev
            .bankerDragonBonus ===
            0,
        "Dragon Bonus unavailable EV 應為 0"
    );

    messages.push(
        "✓ Probability → EV 管線正確"
    );


    let resolverCalls =
        0;


    const resolvedProbability =
        new ProbabilityPipeline({

            supportedKeys:
                Object.keys(
                    BET_CONFIG
                ),

            async resolveAnalysis({

                mode

            }) {

                resolverCalls++;

                return {

                    method:
                        mode,

                    probability: {

                        player:
                            0.45,

                        banker:
                            0.46,

                        tie:
                            0.09

                    },

                    monteCarlo: {

                        simulations:
                            1000

                    },

                    exact:
                        null

                };

            }

        });


    const resolved =
        await new PipelineManager({

            pipelines:
                [

                    resolvedProbability
                        .toDefinition()

                ]

        })
            .run({

                runOptions: {

                    mode:
                        "monteCarlo"

                }

            });


    assert(
        resolverCalls ===
            1 &&
        resolved.state
            .method ===
            "monteCarlo" &&
        resolved.state
            .monteCarlo
            .simulations ===
            1000,
        "resolveAnalysis 整合錯誤"
    );

    messages.push(
        "✓ Probability resolver 正確"
    );


    const totalError =
        await assertRejects(
            () =>
                manager.run({

                    runOptions: {

                        probability: {

                            player:
                                0.5,

                            banker:
                                0.5,

                            tie:
                                0.5

                        }

                    }

                }),
            "機率總和錯誤時應拒絕"
        );


    assert(
        totalError.message
            .includes(
                "must total"
            ),
        "機率總和錯誤訊息不正確"
    );


    const missingError =
        await assertRejects(
            () =>
                manager.run({

                    runOptions: {

                        probability: {

                            player:
                                0.5,

                            banker:
                                0.5

                        }

                    }

                }),
            "缺少 tie 時應拒絕"
        );


    assert(
        missingError.message
            .includes(
                "Missing required probability: tie"
            ),
        "缺少主注機率錯誤訊息不正確"
    );

    messages.push(
        "✓ Probability 驗證正確"
    );


    assert(
        probabilityPipeline
            .summary
            .version ===
            "3.5.0" &&
        evPipeline
            .summary
            .bets ===
            8,
        "Pipeline summary 錯誤"
    );

    messages.push(
        "✓ Core Pipeline summary 正確"
    );


    return `

${messages.join("\n")}

Core Pipelines V3.5 測試完成

ProbabilityPipeline：通過
EVPipeline：通過
Provided Probability：通過
Resolver：通過
Probability Validation：通過
Dragon Bonus Status：通過

`;

}
