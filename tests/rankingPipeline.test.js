/**
 * Baccarat Analyzer V3.6
 * tests/rankingPipeline.test.js
 */

import PipelineManager
    from "../analysis/pipeline/PipelineManager.js";

import RankingPipeline, {
    RANKING_PIPELINE_VERSION
} from "../analysis/pipeline/RankingPipeline.js";

import Ranking
    from "../analysis/ranking.js";

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

const BET_CONFIG = {
    player: {},
    banker: {},
    tie: {},
    playerPair: {},
    bankerPair: {},
    super6: {},
    playerDragonBonus: {},
    bankerDragonBonus: {}
};

export default async function rankingPipelineTest() {
    const messages = [];

    assert(
        RANKING_PIPELINE_VERSION === "3.6.0",
        "RankingPipeline 版本錯誤"
    );

    const pipeline =
        new RankingPipeline({
            engine:
                new Ranking({
                    strategy: "balanced",
                    minimumEV: 0,
                    minimumConfidence: 0.6,
                    requirePositiveKelly: true
                }),
            betConfig:
                BET_CONFIG,
            topCount:
                3
        });

    const result =
        await new PipelineManager({
            pipelines: [
                pipeline.toDefinition()
            ]
        }).run({
            probability: {
                player: 0.46,
                banker: 0.45,
                tie: 0.09,
                playerPair: 0.075
            },
            ev: {
                player: 0.02,
                banker: 0.01,
                tie: -0.12,
                playerPair: 0.03
            },
            evStatus: {
                player: "available",
                banker: "available",
                tie: "available",
                playerPair: "available"
            },
            kelly: {
                player: 0.02,
                banker: 0.01,
                tie: 0,
                playerPair: 0.03
            },
            fullKelly: {
                player: 0.08,
                banker: 0.04,
                tie: 0,
                playerPair: 0.12
            },
            amount: {
                player: 200,
                banker: 100,
                tie: 0,
                playerPair: 300
            },
            risk: {
                player: 0.2,
                banker: 0.3,
                tie: 0.8,
                playerPair: 0.4
            },
            confidence: {
                player: 0.9,
                banker: 0.8,
                tie: 0.7,
                playerPair: 0.95
            }
        });

    assert(
        Object.keys(
            result.state.rankingInput
        ).length === 3,
        "主推薦排名只應包含 player / banker / tie"
    );

    assert(
        !("playerPair" in result.state.rankingInput),
        "側注不應進入主推薦 Ranking"
    );

    messages.push("✓ 主注候選範圍正確");

    assert(
        result.state.ranking[0].name === "player",
        "Player 應為最佳排名"
    );

    assert(
        result.state.best?.name === "player",
        "Best Bet 錯誤"
    );

    assert(
        result.state.bestEV === 0.02 &&
        result.state.bestProbability === 0.46,
        "Best 摘要錯誤"
    );

    messages.push("✓ Ranking 與 Best 正確");

    assert(
        result.state.topRanking.length === 2,
        "Top Ranking 應只包含合格候選"
    );

    assert(
        result.state.rejectedRanking.some(
            item => item.name === "tie"
        ),
        "負 EV Tie 應被拒絕"
    );

    messages.push("✓ Top 與 Rejected 正確");

    assert(
        pipeline.summary.version === "3.6.0" &&
        pipeline.summary.topCount === 3 &&
        pipeline.summary.allowedNames.length === 3,
        "RankingPipeline summary 錯誤"
    );

    messages.push("✓ summary 正確");

    return `
${messages.join("\n")}

Ranking Pipeline V3.6 測試完成

Main Bets：通過
Ranking：通過
Best Bet：通過
Top Ranking：通過
Rejected Ranking：通過
`;
}
