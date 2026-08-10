/**
 * Baccarat Analyzer V10.7.0
 * Path: tests/decisionIntelligenceSignalAttribution.test.js
 * Test Runner: tests/main.js
 * Decision Intelligence & Signal Attribution regressions.
 */

import AILiveDecisionEngine, {
    LiveDecisionAction
} from "../runtime/liveCasino/AILiveDecisionEngine.js";

import DecisionStabilityExplainabilityEngine
    from "../runtime/liveCasino/DecisionStabilityExplainabilityEngine.js";

import DecisionIntelligenceSignalAttributionEngine, {
    DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_VERSION,
    DecisionAuthority,
    EXECUTION_READINESS_WEIGHTS,
    OPPORTUNITY_STRENGTH_WEIGHTS,
    SignalAttributionType
} from "../runtime/liveCasino/DecisionIntelligenceSignalAttributionEngine.js";

import LiveCasinoPerformancePolicy, {
    DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_POLICY_VERSION
} from "../runtime/liveCasino/LiveCasinoPerformancePolicy.js";

import LiveCasinoUXController, {
    DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_UX_VERSION
} from "../runtime/liveCasino/LiveCasinoUXController.js";

import {
    DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_STYLES_VERSION,
    LIVE_CASINO_UX_CSS
} from "../runtime/liveCasino/LiveCasinoUXStyles.js";

import {
    DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_FACTORY_VERSION
} from "../runtime/liveCasino/createLiveCasinoUXController.js";

import {
    DASHBOARD_DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_VERSION
} from "../pages/dashboard.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function analysis({
    round = 31,
    method = "hybrid",
    playerEV = -0.01226,
    bankerEV = -0.013896,
    key = "player",
    shouldBet = false,
    amount = 0,
    confidence = 0.82,
    risk = 0.952
} = {}) {
    const exact =
        method === "hybrid" ||
        method === "exact";
    const otherKey =
        key === "player"
            ? "banker"
            : "player";

    return {
        generatedAfterRound:
            round,
        method,
        probability: {
            player: 0.4467,
            banker: 0.4589,
            tie: 0.0944
        },
        ev: {
            player: playerEV,
            banker: bankerEV,
            tie: -0.1503
        },
        monteCarlo: {
            sampleSize: 1200
        },
        exact:
            exact
                ? {
                    probability: {
                        player: 0.4467,
                        banker: 0.4589,
                        tie: 0.0944
                    }
                }
                : null,
        confidence: {
            overall:
                confidence,
            [key]: {
                confidenceScore:
                    confidence,
                zScore:
                    1.959963984540054
            }
        },
        overallConfidence:
            confidence,
        risk: {
            [key]: {
                relativeRisk:
                    risk,
                standardDeviation:
                    0.01,
                riskLabel:
                    "中等風險"
            }
        },
        kelly: {
            [key]: {
                fullKelly:
                    amount > 0
                        ? 0.02
                        : 0,
                appliedKelly:
                    amount > 0
                        ? 0.01
                        : 0,
                rawAmount:
                    amount,
                amount,
                bankroll: 10000
            }
        },
        amount: {
            [key]:
                amount
        },
        ranking: [
            {
                key,
                ev:
                    key === "player"
                        ? playerEV
                        : bankerEV,
                confidence,
                risk,
                standardDeviation: 0.01,
                amount,
                rawAmount:
                    amount
            },
            {
                key:
                    otherKey,
                ev:
                    otherKey === "player"
                        ? playerEV
                        : bankerEV,
                confidence:
                    confidence - 0.03,
                risk,
                standardDeviation: 0.01,
                amount: 0,
                rawAmount: 0
            }
        ],
        recommendation: {
            shouldBet,
            action:
                shouldBet
                    ? "bet"
                    : "skip",
            key,
            bet:
                key,
            amount:
                shouldBet
                    ? amount
                    : 0,
            limits: {
                minBet: 100,
                maxBet: 10000
            }
        }
    };
}


function comparison(
    provisional,
    final
) {
    return {
        provisional: {
            key:
                provisional.recommendationKey ??
                provisional.relativeKey,
            label:
                provisional.recommendationLabel ??
                provisional.relativeLabel,
            ev:
                provisional.ev?.[
                    provisional.recommendationKey ??
                    provisional.relativeKey
                ],
            action:
                provisional.action,
            amount:
                provisional.amount,
            evidence:
                provisional.evidence
                    ?.shortLabel
        },
        final: {
            key:
                final.recommendationKey ??
                final.relativeKey,
            label:
                final.recommendationLabel ??
                final.relativeLabel,
            ev:
                final.ev?.[
                    final.recommendationKey ??
                    final.relativeKey
                ],
            action:
                final.action,
            amount:
                final.amount,
            evidence:
                final.evidence
                    ?.shortLabel
        },
        candidateChanged:
            (
                provisional.recommendationKey ??
                provisional.relativeKey
            ) !==
            (
                final.recommendationKey ??
                final.relativeKey
            ),
        actionChanged:
            provisional.action !==
            final.action,
        deltaEV:
            final.ev?.player -
            provisional.ev?.player,
        replacedProvisional: true
    };
}


export default async function decisionIntelligenceSignalAttributionTest() {
    const messages = [];

    assert(
        [
            DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_VERSION,
            DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_POLICY_VERSION,
            DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_UX_VERSION,
            DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_STYLES_VERSION,
            DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_FACTORY_VERSION,
            DASHBOARD_DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_VERSION
        ].every(version =>
            version === "10.7.0"
        ) &&
        Object.values(
            EXECUTION_READINESS_WEIGHTS
        ).reduce(
            (total, value) =>
                total + value,
            0
        ) === 100 &&
        Object.values(
            OPPORTUNITY_STRENGTH_WEIGHTS
        ).reduce(
            (total, value) =>
                total + value,
            0
        ) === 100,
        "V10.7 全層版本或 100 分權重契約錯誤"
    );

    messages.push(
        "✓ V10.7 全層版本與獨立指標權重契約正確"
    );

    const core =
        new AILiveDecisionEngine();
    const stability =
        new DecisionStabilityExplainabilityEngine();
    const intelligence =
        new DecisionIntelligenceSignalAttributionEngine();
    const provisionalAnalysis =
        analysis({
            method: "monteCarlo",
            playerEV: 0.0025,
            bankerEV: -0.014,
            key: "player"
        });
    const finalAnalysis =
        analysis();
    const provisionalRaw =
        core.decide(
            provisionalAnalysis
        );
    const finalRaw =
        core.decide(
            finalAnalysis
        );

    stability.start({
        sequence: 1,
        roundId: 31,
        shoeId: 4
    });

    const provisionalStable =
        stability.acceptProvisional(
            provisionalAnalysis,
            provisionalRaw,
            {
                sequence: 1,
                roundId: 31
            }
        );
    const provisionalIntelligence =
        intelligence.explain(
            provisionalStable,
            {
                confirmation: {
                    state: "provisional",
                    isFinal: false,
                    comparison: null
                }
            }
        );

    assert(
        provisionalIntelligence
            .canonicalDecision
            .authority ===
            DecisionAuthority.PROVISIONAL_MC &&
        provisionalIntelligence
            .decisionIntelligence
            .resultConfirmation
            .score === 40 &&
        provisionalIntelligence.action ===
            LiveDecisionAction.WAIT &&
        provisionalIntelligence.amount === 0 &&
        provisionalIntelligence
            .decisionIntelligence
            .signalAttribution
            .type ===
            SignalAttributionType.WAITING_EXACT,
        "MC 暫定結果未被標示為非正式預覽"
    );

    const finalStable =
        stability.acceptFinal(
            finalAnalysis,
            finalRaw,
            {
                sequence: 1,
                roundId: 31,
                durationMs: 1469
            }
        );
    const exactComparison =
        comparison(
            provisionalRaw,
            finalRaw
        );
    const finalIntelligence =
        intelligence.explain(
            finalStable,
            {
                confirmation: {
                    state: "confirmed",
                    isFinal: true,
                    comparison:
                        exactComparison
                }
            }
        );
    const intel =
        finalIntelligence
            .decisionIntelligence;

    assert(
        intel.canonical.authority ===
            DecisionAuthority.FINAL_EXACT &&
        intel.canonical.locked === true &&
        intel.canonical.snapshotId ===
            finalStable.finalSnapshot
                .snapshotId &&
        finalIntelligence
            .authoritativeSnapshot ===
            finalStable.finalSnapshot &&
        finalIntelligence.action ===
            finalStable.action &&
        finalIntelligence.amount ===
            finalStable.amount &&
        finalIntelligence
            .recommendationLabel ===
            finalStable
                .recommendationLabel,
        "V10.7 未沿用 V10.6 唯一正式快照或改寫正式決策"
    );

    assert(
        intel.signalAttribution.type ===
            SignalAttributionType
                .FALSE_POSITIVE_REJECTED &&
        intel.signalAttribution.headline
            .includes("否決") &&
        intel.signalAttribution.summary
            .includes("+0.25%") &&
        intel.signalAttribution.summary
            .includes("-1.23%") &&
        intel.signalAttribution.summary
            .includes("正式維持觀望"),
        "MC 正 EV → Exact 負 EV 改判歸因錯誤"
    );

    messages.push(
        "✓ MC 暫定正 EV 被 Exact 否決時會清楚顯示改判"
    );

    assert(
        intel.resultConfirmation.score ===
            100 &&
        intel.resultConfirmation
            .isWinProbability === false &&
        intel.opportunityStrength.score ===
            30 &&
        intel.opportunityStrength.label ===
            "低：只有相對領先" &&
        intel.executionReadiness.score ===
            60 &&
        intel.executionReadiness
            .passedGateCount === 4 &&
        intel.executionReadiness
            .totalGateCount === 6,
        "結果確認度、機會強度與執行門檻未正確拆分"
    );

    assert(
        intel.explanation.primary
            .includes("虧損較少") &&
        intel.explanation.primary
            .includes("仍為負值") &&
        intel.explanation.nextRequirement
            .includes("1.23%") &&
        intel.executionReadiness
            .remainingConditions
            .some(item =>
                item.includes("Kelly")
            ),
        "負 EV 觀望原因或距離門檻說明不完整"
    );

    let mutationBlocked = false;

    try {
        intel.opportunityStrength.score =
            100;
    }
    catch {
        mutationBlocked = true;
    }

    assert(
        Object.isFrozen(intel) &&
        Object.isFrozen(
            intel.canonical
        ) &&
        mutationBlocked &&
        intel.safetyContract
            .changesDecision === false &&
        intel.safetyContract
            .scoreCanForceBet === false,
        "V10.7 情報快照不可變更或安全契約錯誤"
    );

    messages.push(
        "✓ 三種指標互不混淆，情報層不可改寫正式 action"
    );

    const positiveStability =
        new DecisionStabilityExplainabilityEngine();
    const positiveAnalysis =
        analysis({
            round: 32,
            playerEV: -0.008,
            bankerEV: 0.006,
            key: "banker",
            shouldBet: true,
            amount: 100,
            risk: 0.72
        });

    positiveStability.start({
        sequence: 2,
        roundId: 32
    });

    const positiveStable =
        positiveStability.acceptFinal(
            positiveAnalysis,
            core.decide(
                positiveAnalysis
            ),
            {
                sequence: 2,
                roundId: 32
            }
        );
    const positiveIntelligence =
        intelligence.explain(
            positiveStable,
            {
                confirmation: {
                    state: "confirmed",
                    isFinal: true
                }
            }
        );

    assert(
        positiveIntelligence.action ===
            LiveDecisionAction.BET &&
        positiveIntelligence.amount ===
            100 &&
        positiveIntelligence
            .decisionIntelligence
            .opportunityStrength
            .score === 100 &&
        positiveIntelligence
            .decisionIntelligence
            .executionReadiness
            .score === 100 &&
        positiveIntelligence
            .decisionIntelligence
            .signalAttribution
            .type ===
            SignalAttributionType
                .OPPORTUNITY_CONFIRMED,
        "Exact 正 EV 正式機會未保留 BET / 100 分門檻"
    );

    messages.push(
        "✓ 只有 Exact 正式機會可呈現完整執行門檻與建議額"
    );

    let now = 5000;
    const game = {
        nextAnalysis: null,
        shoeNumber: 4
    };
    const controller =
        new LiveCasinoUXController({
            game,
            clock: () => ++now
        });

    controller.analysisSequence = 7;
    controller.exactConfirmation
        .start({
            sequence: 7,
            roundId: 31
        });
    controller.decisionStabilityEngine
        .start({
            sequence: 7,
            roundId: 31,
            shoeId: 4
        });
    controller.acceptAnalysis(
        provisionalAnalysis,
        now - 10,
        "quick"
    );
    controller.acceptAnalysis(
        finalAnalysis,
        now - 10,
        "confirmed"
    );

    const html =
        controller.renderDecisionHTML();
    const dock =
        controller.renderDecisionDockHTML();

    assert(
        html.includes(
            'data-decision-authority="final-exact"'
        ) &&
        html.includes(
            'data-signal-attribution-type="false-positive-rejected"'
        ) &&
        html.includes("唯一決策來源") &&
        html.includes("結果確認度") &&
        html.includes("不是勝率") &&
        html.includes("機會強度") &&
        html.includes("執行門檻") &&
        html.includes(
            "Exact 已否決 MC 暫定正 EV"
        ) &&
        html.includes("為何觀望") &&
        html.includes("安全證據分解（V10.6）") &&
        dock.includes("正式觀望") &&
        dock.includes("確認 100/100") &&
        dock.includes("機會 30/100") &&
        dock.includes("門檻 4/6") &&
        dock.includes(
            "Exact 已否決 MC 暫定正 EV"
        ),
        "Dashboard 或 Decision Dock 未顯示 V10.7 單一真相與改判"
    );

    const fields = new Map();
    const root = {
        querySelector(selector) {
            if (!fields.has(selector)) {
                fields.set(selector, {
                    textContent: ""
                });
            }

            return fields.get(selector);
        }
    };

    controller.updateAIPanel(root);

    assert(
        fields.get("[data-ai-stage]")
            .textContent ===
            "decision-intelligence-signal-attribution-v10.7" &&
        fields.get("[data-ai-confidence]")
            .textContent.includes(
                "非勝率"
            ) &&
        fields.get("[data-ai-feedback]")
            .textContent.includes(
                "Exact 已否決"
            ) &&
        fields.get("[data-ai-adaptive]")
            .textContent.includes(
                "機會強度 30/100"
            ) &&
        controller.summary
            .decisionIntelligenceVersion ===
            "10.7.0" &&
        controller.summary
            .decisionIntelligenceCoreVersion ===
            "10.7.0" &&
        new LiveCasinoPerformancePolicy()
            .summary
            .decisionIntelligenceVersion ===
            "10.7.0" &&
        LIVE_CASINO_UX_CSS.includes(
            ".v107DecisionIntelligence"
        ) &&
        LIVE_CASINO_UX_CSS.includes(
            '[data-signal-attribution-type="false-positive-rejected"]'
        ) &&
        LIVE_CASINO_UX_CSS.includes(
            "@media (max-width: 620px)"
        ),
        "AI Closed-Loop、Policy 或響應式 V10.7 樣式未同步"
    );

    controller.destroy();

    messages.push(
        "✓ Dashboard、Dock、AI Closed-Loop 共用唯一 V10.7 決策情報"
    );

    return `
${messages.join("\n")}

Decision Intelligence & Signal Attribution Engine V10.7.0 測試完成

Single Source Of Truth：通過
MC → Exact Attribution：通過
False Positive Rejection：通過
Result Confirmation Not Win Rate：通過
Opportunity Strength：通過
Execution Readiness：通過
Threshold Distance Explanation：通過
No Decision Mutation：通過
Exact Positive Opportunity：通過
Dashboard Intelligence UI：通過
Mobile Decision Dock Contract：通過
AI Closed-Loop Bridge：通過
`;
}
