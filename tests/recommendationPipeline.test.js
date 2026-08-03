/**
 * Baccarat Analyzer V3.6.1
 * tests/recommendationPipeline.test.js
 */

import PipelineManager
    from "../analysis/pipeline/PipelineManager.js";

import RecommendationPipeline, {
    RECOMMENDATION_PIPELINE_VERSION
} from "../analysis/pipeline/RecommendationPipeline.js";

import Recommendation, {
    ACTION,
    DECISION
} from "../analysis/recommendation.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function rankingItem(
    name,
    {
        rank,
        ev,
        kelly,
        amount,
        risk,
        confidence,
        score,
        eligible = true,
        provisional = false
    }
) {
    return {
        name,
        label: name,
        rank,
        probability: 0.45,
        ev,
        kelly,
        fullKelly:
            kelly * 2,
        amount,
        risk,
        riskLevel:
            risk < 0.3
                ? "low"
                : "medium",
        riskLabel:
            risk < 0.3
                ? "低"
                : "中",
        confidence,
        confidenceLevel:
            confidence >= 0.75
                ? "high"
                : "medium",
        confidenceLabel:
            confidence >= 0.75
                ? "高可信度"
                : "中等可信度",
        confidenceProvisional:
            provisional,
        score,
        eligible
    };
}


export default async function recommendationPipelineTest() {
    const messages = [];

    assert(
        RECOMMENDATION_PIPELINE_VERSION === "3.6.1",
        "RecommendationPipeline 版本錯誤"
    );

    messages.push("✓ V3.6.1 版本正確");

    const pipeline =
        new RecommendationPipeline({
            engine:
                new Recommendation({
                    minimumEV: 0,
                    minimumConfidence: 0.6,
                    maximumRisk: null,
                    minimumScore: 0,
                    requirePositiveKelly: true,
                    requirePositiveAmount: true,
                    allowProvisionalConfidence: false,
                    candidateCount: 3
                })
        });

    const betResult =
        await new PipelineManager({
            pipelines: [
                pipeline.toDefinition()
            ]
        }).run({
            ranking: [
                rankingItem("player", {
                    rank: 1,
                    ev: 0.02,
                    kelly: 0.02,
                    amount: 200,
                    risk: 0.2,
                    confidence: 0.9,
                    score: 0.9
                }),
                rankingItem("banker", {
                    rank: 2,
                    ev: 0.01,
                    kelly: 0.01,
                    amount: 100,
                    risk: 0.3,
                    confidence: 0.8,
                    score: 0.8
                }),
                rankingItem("tie", {
                    rank: 3,
                    ev: -0.12,
                    kelly: 0,
                    amount: 0,
                    risk: 0.8,
                    confidence: 0.7,
                    score: 0.2,
                    eligible: false
                })
            ]
        });

    assert(
        betResult.state.shouldBet === true,
        "正 EV 候選應建議下注"
    );

    assert(
        betResult.state.recommendationAction === ACTION.BET &&
        betResult.state.recommendationDecision ===
            DECISION.RECOMMENDED,
        "下注 Action／Decision 錯誤"
    );

    assert(
        betResult.state.recommendedBet === "player" &&
        betResult.state.recommendedAmount === 200,
        "最佳下注或金額錯誤"
    );

    assert(
        betResult.state
            .recommendationCandidates
            .length === 2,
        "候選數量錯誤"
    );

    assert(
        betResult.state
            .recommendationRejected
            .some(
                item =>
                    item.name === "tie"
            ),
        "Tie 應出現在 rejected"
    );

    assert(
        betResult.state
            .recommendationReasons
            .length > 0 &&
        typeof betResult.state
            .recommendationMessage === "string",
        "推薦理由或訊息錯誤"
    );

    messages.push("✓ 下注建議輸出正確");

    const skipResult =
        await new PipelineManager({
            pipelines: [
                pipeline.toDefinition()
            ]
        }).run({
            ranking: [
                rankingItem("player", {
                    rank: 1,
                    ev: -0.01,
                    kelly: 0,
                    amount: 0,
                    risk: 0.2,
                    confidence: 0.9,
                    score: 0.8,
                    eligible: false
                }),
                rankingItem("banker", {
                    rank: 2,
                    ev: 0,
                    kelly: 0,
                    amount: 0,
                    risk: 0.3,
                    confidence: 0.8,
                    score: 0.7,
                    eligible: false
                })
            ]
        });

    assert(
        skipResult.state.shouldBet === false,
        "全部不合格時應不下注"
    );

    assert(
        skipResult.state.recommendationAction === ACTION.SKIP &&
        skipResult.state.recommendationDecision ===
            DECISION.REJECTED,
        "Skip Action／Decision 錯誤"
    );

    assert(
        skipResult.state.recommendedBet === null &&
        skipResult.state.recommendedAmount === 0,
        "不下注輸出錯誤"
    );

    assert(
        skipResult.state
            .recommendationCandidates
            .length === 0 &&
        skipResult.state
            .recommendationRejected
            .length === 2,
        "不下注候選／拒絕數量錯誤"
    );

    messages.push("✓ 不下注策略正確");

    const provisionalResult =
        await new PipelineManager({
            pipelines: [
                pipeline.toDefinition()
            ]
        }).run({
            ranking: [
                rankingItem("player", {
                    rank: 1,
                    ev: 0.02,
                    kelly: 0.02,
                    amount: 200,
                    risk: 0.2,
                    confidence: 0.9,
                    score: 0.9,
                    provisional: true
                })
            ]
        });

    assert(
        provisionalResult.state.shouldBet === false,
        "暫時可信度預設不得下注"
    );

    assert(
        provisionalResult.state
            .recommendationRejected[0]
            .rejectedReasons
            .some(
                reason =>
                    reason.includes("暫時值")
            ),
        "暫時可信度拒絕原因錯誤"
    );

    messages.push("✓ Provisional Gate 正確");

    const runtimeOptions =
        await new PipelineManager({
            pipelines: [
                pipeline.toDefinition()
            ]
        }).run({
            ranking: [
                rankingItem("player", {
                    rank: 1,
                    ev: 0.02,
                    kelly: 0.02,
                    amount: 200,
                    risk: 0.2,
                    confidence: 0.9,
                    score: 0.9,
                    provisional: true
                })
            ],
            runOptions: {
                recommendationOptions: {
                    allowProvisionalConfidence:
                        true
                }
            }
        });

    assert(
        runtimeOptions.state.shouldBet === true,
        "Runtime recommendationOptions 未套用"
    );

    messages.push("✓ Runtime Options 正確");

    assert(
        pipeline.summary.version === "3.6.1" &&
        pipeline.summary.hasLastRecommendation === true,
        "RecommendationPipeline summary 錯誤"
    );

    messages.push("✓ summary 正確");

    return `
${messages.join("\n")}

Recommendation Pipeline V3.6.1 測試完成

Bet Recommendation：通過
Skip Strategy：通過
Candidates：通過
Rejected：通過
Provisional Gate：通過
Runtime Options：通過
`;
}
