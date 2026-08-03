/**
 * Baccarat Analyzer V3.5.1
 * tests/analysisPipelines.test.js
 */

import PipelineManager
    from "../analysis/pipeline/PipelineManager.js";

import KellyRiskPipeline, {
    KELLY_RISK_PIPELINE_VERSION
} from "../analysis/pipeline/KellyRiskPipeline.js";

import ConfidencePipeline, {
    CONFIDENCE_PIPELINE_VERSION
} from "../analysis/pipeline/ConfidencePipeline.js";

import Confidence
    from "../analysis/confidence.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


const BET_CONFIG = {
    player: {},
    banker: {},
    tie: {}
};


class KellyMock {
    calculateBet({ ev }) {
        return {
            fraction:
                Math.max(0, ev * 2),
            fullKelly:
                Math.max(0, ev * 4)
        };
    }
}


class RiskMock {
    evaluateBet({ amount, ev }) {
        const value =
            amount <= 0
                ? 1
                : Math.max(0, 0.5 - ev);

        return {
            value,
            level:
                value < 0.5
                    ? "medium"
                    : "high",
            label:
                value < 0.5
                    ? "中"
                    : "高"
        };
    }
}


export default async function analysisPipelinesTest() {
    const messages = [];

    assert(
        KELLY_RISK_PIPELINE_VERSION === "3.5.0" &&
        CONFIDENCE_PIPELINE_VERSION === "3.5.1",
        "Phase C Pipeline 版本錯誤"
    );

    messages.push("✓ V3.5.1 版本正確");

    const kellyRisk =
        new KellyRiskPipeline({
            kellyEngine:
                new KellyMock(),
            riskEngine:
                new RiskMock(),
            betConfig:
                BET_CONFIG,
            bankroll:
                10000,
            fraction:
                0.25,
            minBet:
                100,
            maxBet:
                10000,
            roundTo:
                100
        });

    const confidence =
        new ConfidencePipeline({
            engine:
                new Confidence(),
            betConfig:
                BET_CONFIG,
            overallMethod:
                "engine"
        });

    const result =
        await new PipelineManager({
            pipelines: [
                kellyRisk.toDefinition(),
                confidence.toDefinition()
            ]
        }).run({
            probability: {
                player: 0.46,
                banker: 0.45,
                tie: 0.09
            },
            ev: {
                player: 0.02,
                banker: 0.01,
                tie: -0.1
            },
            monteCarlo: {
                simulations: 100000,
                probability: {
                    player: 0.46,
                    banker: 0.45,
                    tie: 0.09
                }
            },
            exact: {
                probability: {
                    player: 0.459,
                    banker: 0.451,
                    tie: 0.09
                }
            },
            method:
                "hybrid"
        });

    assert(
        result.execution[0].name ===
            "kelly-risk" &&
        result.execution[1].name ===
            "confidence",
        "Pipeline 順序錯誤"
    );

    assert(
        result.state.kelly.player === 0.01,
        "Fractional Kelly 錯誤"
    );

    assert(
        result.state.amount.player === 100,
        "Player Kelly 金額錯誤"
    );

    assert(
        result.state.amount.banker === 0 &&
        result.state.amount.tie === 0,
        "最低下注或負 EV 金額錯誤"
    );

    messages.push("✓ Kelly 與下注限制正確");

    assert(
        Number.isFinite(
            result.state.risk.player
        ),
        "Risk 正規化錯誤"
    );

    messages.push("✓ Risk 正規化正確");

    assert(
        Number.isFinite(
            result.state.confidence.player
        ) &&
        result.state.confidence.player >= 0 &&
        result.state.confidence.player <= 1,
        "Confidence Score 錯誤"
    );

    assert(
        typeof result.state
            .confidenceLevel.player ===
            "string" &&
        typeof result.state
            .confidenceLabel.player ===
            "string",
        "Confidence Level／Label 錯誤"
    );

    assert(
        result.state
            .confidenceDetails
            .player
            .confidenceScore ===
        result.state
            .confidence
            .player,
        "Confidence 詳細映射錯誤"
    );

    assert(
        result.state
            .confidenceProvisional
            .player === false,
        "有 Exact 時不應為 provisional"
    );

    assert(
        Number.isFinite(
            result.state.overallConfidence
        ) &&
        result.state
            .overallConfidenceDetails
            .itemCount === 3,
        "Overall Confidence 錯誤"
    );

    messages.push("✓ Confidence Engine 相容性正確");

    const provisional =
        await new PipelineManager({
            pipelines: [
                new ConfidencePipeline({
                    engine:
                        new Confidence(),
                    betConfig: {
                        player: {}
                    },
                    overallMethod:
                        "engine"
                }).toDefinition()
            ]
        }).run({
            probability: {
                player: 0.46
            },
            ev: {
                player: 0.02
            },
            monteCarlo: {
                simulations: 50000
            }
        });

    assert(
        provisional.state
            .confidenceProvisional
            .player === true &&
        provisional.state
            .confidenceDetails
            .player
            .hasExact === false,
        "Provisional Confidence 錯誤"
    );

    messages.push("✓ Provisional Confidence 正確");

    assert(
        confidence.summary.version === "3.5.1" &&
        confidence.summary.engineCompatible === true,
        "Confidence summary 錯誤"
    );

    messages.push("✓ summary 正確");

    return `
${messages.join("\n")}

Analysis Pipelines V3.5.1 測試完成

KellyRiskPipeline：通過
ConfidencePipeline：通過
Confidence Engine Compatibility：通過
Provisional Confidence：通過
Overall Confidence：通過
`;
}
