/**
 * Baccarat Analyzer V3.5
 * tests/analysisPipelines.test.js
 */

import PipelineManager from "../analysis/pipeline/PipelineManager.js";
import KellyRiskPipeline, {
    KELLY_RISK_PIPELINE_VERSION
} from "../analysis/pipeline/KellyRiskPipeline.js";
import ConfidencePipeline, {
    CONFIDENCE_PIPELINE_VERSION
} from "../analysis/pipeline/ConfidencePipeline.js";

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const BET_CONFIG = { player: {}, banker: {}, tie: {} };

class KellyMock {
    calculateBet({ ev }) {
        return {
            fraction: Math.max(0, ev * 2),
            fullKelly: Math.max(0, ev * 4)
        };
    }
}

class RiskMock {
    evaluateBet({ amount, ev }) {
        const value = amount <= 0 ? 1 : Math.max(0, 0.5 - ev);
        return {
            value,
            level: value < 0.5 ? "medium" : "high",
            label: value < 0.5 ? "中" : "高"
        };
    }
}

class ConfidenceMock {
    evaluateBet({ ev, risk, amount }) {
        const value = amount <= 0
            ? 0.4
            : Math.min(1, 0.6 + ev - risk * 0.1);
        return {
            value,
            level: value >= 0.6 ? "medium" : "low",
            label: value >= 0.6 ? "中" : "低",
            provisional: false
        };
    }
}

export default async function analysisPipelinesTest() {
    const messages = [];

    assert(
        KELLY_RISK_PIPELINE_VERSION === "3.5.0" &&
        CONFIDENCE_PIPELINE_VERSION === "3.5.0",
        "Phase C Pipeline 版本錯誤"
    );
    messages.push("✓ V3.5 Phase C 版本正確");

    const kellyRisk = new KellyRiskPipeline({
        kellyEngine: new KellyMock(),
        riskEngine: new RiskMock(),
        betConfig: BET_CONFIG,
        bankroll: 10000,
        fraction: 0.25,
        minBet: 100,
        maxBet: 10000,
        roundTo: 100
    });

    const confidence = new ConfidencePipeline({
        engine: new ConfidenceMock(),
        betConfig: BET_CONFIG,
        overallMethod: "bestEV"
    });

    const result = await new PipelineManager({
        pipelines: [
            kellyRisk.toDefinition(),
            confidence.toDefinition()
        ]
    }).run({
        probability: { player: 0.46, banker: 0.45, tie: 0.09 },
        ev: { player: 0.02, banker: 0.01, tie: -0.1 },
        method: "provided",
        roundCount: 12,
        historyCount: 12
    });

    assert(
        result.execution[0].name === "kelly-risk" &&
        result.execution[1].name === "confidence",
        "Phase C Pipeline 順序錯誤"
    );

    assert(result.state.kelly.player === 0.01, "Fractional Kelly 錯誤");
    assert(result.state.fullKelly.player === 0.08, "Full Kelly 錯誤");
    assert(result.state.amount.player === 100, "Player Kelly 金額錯誤");
    assert(result.state.amount.banker === 0, "低於最低下注應為 0");
    assert(result.state.amount.tie === 0, "負 EV 金額應為 0");
    messages.push("✓ Kelly、下注金額與限制正確");

    assert(
        Number.isFinite(result.state.risk.player) &&
        result.state.riskLevel.player === "medium" &&
        result.state.riskLabel.player === "中",
        "Risk 正規化錯誤"
    );
    messages.push("✓ Risk 正規化正確");

    assert(
        Number.isFinite(result.state.confidence.player) &&
        result.state.confidenceLevel.player === "medium" &&
        result.state.confidenceProvisional.player === false,
        "Confidence 正規化錯誤"
    );

    assert(
        result.state.overallConfidence === result.state.confidence.player,
        "bestEV overallConfidence 錯誤"
    );
    messages.push("✓ Confidence 與 overallConfidence 正確");

    const limited = await new PipelineManager({
        pipelines: [
            new KellyRiskPipeline({
                kellyEngine: {
                    calculateBet() {
                        return { fraction: 1, fullKelly: 1 };
                    }
                },
                riskEngine: new RiskMock(),
                betConfig: { player: {} },
                bankroll: 5000,
                fraction: 1,
                minBet: 100,
                maxBet: 10000,
                roundTo: 100,
                maxBankrollRatio: 0.2
            }).toDefinition()
        ]
    }).run({
        probability: { player: 0.5 },
        ev: { player: 0.1 }
    });

    assert(limited.state.amount.player === 1000, "maxBankrollRatio 限制錯誤");
    messages.push("✓ Bankroll ratio 限制正確");

    assert(
        kellyRisk.summary.version === "3.5.0" &&
        confidence.summary.overallMethod === "bestEV",
        "Phase C summary 錯誤"
    );
    messages.push("✓ Phase C summary 正確");

    return `
${messages.join("\n")}

Analysis Pipelines V3.5 測試完成

KellyRiskPipeline：通過
ConfidencePipeline：通過
Bet Limits：通過
Risk Normalization：通過
Overall Confidence：通過
`;
}
