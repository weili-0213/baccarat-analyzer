/**
 * Baccarat Analyzer V3.6.2
 * tests/resultPipeline.test.js
 */

import PipelineManager
    from "../analysis/pipeline/PipelineManager.js";

import ResultPipeline, {
    RESULT_PIPELINE_VERSION
} from "../analysis/pipeline/ResultPipeline.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


export default async function resultPipelineTest() {
    const messages = [];

    assert(
        RESULT_PIPELINE_VERSION === "3.6.2",
        "ResultPipeline 版本錯誤"
    );

    messages.push("✓ V3.6.2 版本正確");

    const pipeline =
        new ResultPipeline();

    const pipelineResult =
        await new PipelineManager({
            pipelines: [
                pipeline.toDefinition()
            ]
        }).run({
            method:
                "hybrid",

            probability: {
                player: 0.46,
                banker: 0.45,
                tie: 0.09
            },

            monteCarlo: {
                simulations: 100000
            },

            exact: {
                completed: true
            },

            ev: {
                player: 0.02,
                banker: 0.01,
                tie: -0.12
            },

            evStatus: {
                player: "available",
                banker: "available",
                tie: "available"
            },

            kelly: {
                player: 0.02,
                banker: 0.01,
                tie: 0
            },

            fullKelly: {
                player: 0.08,
                banker: 0.04,
                tie: 0
            },

            amount: {
                player: 200,
                banker: 100,
                tie: 0
            },

            risk: {
                player: 0.2,
                banker: 0.3,
                tie: 0.8
            },

            riskLevel: {
                player: "low",
                banker: "medium",
                tie: "high"
            },

            riskLabel: {
                player: "低",
                banker: "中",
                tie: "高"
            },

            confidence: {
                player: 0.9,
                banker: 0.8,
                tie: 0.7
            },

            confidencePercent: {
                player: 90,
                banker: 80,
                tie: 70
            },

            confidenceLevel: {
                player: "veryHigh",
                banker: "high",
                tie: "medium"
            },

            confidenceLabel: {
                player: "極高可信度",
                banker: "高可信度",
                tie: "中等可信度"
            },

            confidenceProvisional: {
                player: false,
                banker: false,
                tie: false
            },

            overallConfidence:
                0.8,

            overallConfidencePercent:
                80,

            overallConfidenceLevel:
                "high",

            overallConfidenceLabel:
                "高可信度",

            ranking: [
                {
                    name: "player",
                    rank: 1,
                    ev: 0.02,
                    eligible: true
                },
                {
                    name: "banker",
                    rank: 2,
                    ev: 0.01,
                    eligible: true
                },
                {
                    name: "tie",
                    rank: 3,
                    ev: -0.12,
                    eligible: false
                }
            ],

            mainRanking: [
                {
                    name: "player",
                    rank: 1,
                    ev: 0.02,
                    eligible: true
                }
            ],

            topRanking: [
                {
                    name: "player",
                    rank: 1,
                    ev: 0.02,
                    eligible: true
                },
                {
                    name: "banker",
                    rank: 2,
                    ev: 0.01,
                    eligible: true
                }
            ],

            rejectedRanking: [
                {
                    name: "tie",
                    rank: 3,
                    ev: -0.12,
                    eligible: false
                }
            ],

            best: {
                name: "player",
                ev: 0.02,
                probability: 0.46
            },

            bestEV:
                0.02,

            bestProbability:
                0.46,

            recommendation: {
                action: "bet",
                decision: "recommended",
                shouldBet: true,
                bet: "player",
                label: "閒",
                amount: 200,
                candidates: [
                    {
                        name: "player"
                    },
                    {
                        name: "banker"
                    }
                ],
                rejected: [
                    {
                        name: "tie"
                    }
                ],
                reasons: [
                    "EV 為正"
                ],
                warnings: [],
                headline:
                    "建議下注：閒",
                message:
                    "最高 EV 為閒"
            },

            shouldBet:
                true,

            recommendationAction:
                "bet",

            recommendationDecision:
                "recommended",

            recommendationCandidates: [
                {
                    name: "player"
                },
                {
                    name: "banker"
                }
            ],

            recommendationRejected: [
                {
                    name: "tie"
                }
            ],

            recommendedBet:
                "player",

            recommendedLabel:
                "閒",

            recommendedAmount:
                200,

            recommendationReasons: [
                "EV 為正"
            ],

            recommendationWarnings:
                [],

            recommendationHeadline:
                "建議下注：閒",

            recommendationMessage:
                "最高 EV 為閒",

            bankroll:
                10000,

            bettingLimits: {
                minBet: 100,
                maxBet: 10000,
                roundTo: 100
            },

            roundCount:
                12,

            historyCount:
                12,

            generatedAfterRound:
                12,

            physicalRemaining:
                300,

            observableRemaining:
                296,

            unknownCards:
                4
        });

    const result =
        pipelineResult.state.analysisResult;

    assert(
        result ===
            pipelineResult.state.finalResult,
        "analysisResult 與 finalResult 應指向同一結果"
    );

    assert(
        result.version === "3.6.2" &&
        result.method === "hybrid",
        "版本或 method 錯誤"
    );

    messages.push("✓ 最終結果基本欄位正確");

    assert(
        result.probability.player === 0.46 &&
        result.ev.player === 0.02 &&
        result.kelly.player === 0.02 &&
        result.amount.player === 200,
        "分析數值映射錯誤"
    );

    assert(
        result.riskLevel.player === "low" &&
        result.confidenceLevel.player === "veryHigh" &&
        result.overallConfidence === 0.8,
        "Risk／Confidence 映射錯誤"
    );

    messages.push("✓ Analysis 欄位映射正確");

    assert(
        result.ranking.length === 3 &&
        result.topRanking.length === 2 &&
        result.rejectedRanking.length === 1 &&
        result.best.name === "player",
        "Ranking 欄位映射錯誤"
    );

    messages.push("✓ Ranking 欄位映射正確");

    assert(
        result.shouldBet === true &&
        result.recommendedBet === "player" &&
        result.recommendedAmount === 200 &&
        result.recommendationCandidates.length === 2 &&
        result.recommendationRejected.length === 1,
        "Recommendation 欄位映射錯誤"
    );

    messages.push("✓ Recommendation 欄位映射正確");

    assert(
        result.generatedAfterRound === 12 &&
        result.physicalRemaining === 300 &&
        result.observableRemaining === 296 &&
        result.unknownCards === 4,
        "牌靴摘要映射錯誤"
    );

    assert(
        result.summary.bestBet === "player" &&
        result.summary.shouldBet === true &&
        result.summary.candidateCount === 2,
        "summary 錯誤"
    );

    messages.push("✓ Shoe 與 Summary 正確");

    const defaults =
        await new PipelineManager({
            pipelines: [
                new ResultPipeline()
                    .toDefinition()
            ]
        }).run({
            probability: {},
            ev: {},
            ranking: [],
            recommendation: {
                shouldBet: false
            }
        });

    const empty =
        defaults.state.analysisResult;

    assert(
        empty.shouldBet === false &&
        empty.recommendedBet === null &&
        empty.recommendedAmount === 0 &&
        Array.isArray(empty.ranking) &&
        Array.isArray(
            empty.recommendationCandidates
        ),
        "預設值輸出錯誤"
    );

    messages.push("✓ 預設值正確");

    const debugPipeline =
        new ResultPipeline({
            includeInternalState: true
        });

    const debug =
        await new PipelineManager({
            pipelines: [
                debugPipeline.toDefinition()
            ]
        }).run({
            probability: {},
            ev: {},
            ranking: [],
            recommendation: {
                shouldBet: false
            },
            customField:
                "debug"
        });

    assert(
        debug.state
            .analysisResult
            .internalState
            .customField ===
            "debug",
        "includeInternalState 錯誤"
    );

    assert(
        pipeline.summary.version === "3.6.2" &&
        pipeline.summary.hasLastResult === true &&
        pipeline.summary.lastShouldBet === true,
        "ResultPipeline summary 錯誤"
    );

    messages.push("✓ Debug 與 Summary 正確");

    return `
${messages.join("\n")}

Result Pipeline V3.6.2 測試完成

Final Output：通過
Analysis Mapping：通過
Ranking Mapping：通過
Recommendation Mapping：通過
Shoe Summary：通過
Defaults：通過
Debug State：通過
`;
}
