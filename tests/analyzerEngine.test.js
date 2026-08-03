/**
 * Baccarat Analyzer V6.5
 * tests/analyzerEngine.test.js
 */

import AnalyzerEngine, {
    ANALYZER_ENGINE_VERSION,
    AnalyzerEvent
} from "../casino/analyzer/AnalyzerEngine.js";

import {
    ANALYZER_STATE_VERSION,
    AnalyzerState
} from "../casino/analyzer/AnalyzerState.js";

import AnalysisHistory, {
    ANALYSIS_HISTORY_VERSION
} from "../casino/analyzer/AnalysisHistory.js";

import AnalysisCache, {
    ANALYSIS_CACHE_VERSION
} from "../casino/analyzer/AnalysisCache.js";

import AnalyzerEngineRuntimeAdapter, {
    ANALYZER_ENGINE_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/AnalyzerEngineRuntimeAdapter.js";

import {
    ANALYZER_ENGINE_FACTORY_VERSION
} from "../casino/analyzer/createAnalyzerEngine.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


export default async function analyzerEngineTest() {
    const messages = [];

    assert(
        ANALYZER_ENGINE_VERSION ===
            "6.5.0" &&
        ANALYZER_STATE_VERSION ===
            "6.5.0" &&
        ANALYSIS_HISTORY_VERSION ===
            "6.5.0" &&
        ANALYSIS_CACHE_VERSION ===
            "6.5.0" &&
        ANALYZER_ENGINE_RUNTIME_ADAPTER_VERSION ===
            "6.5.0" &&
        ANALYZER_ENGINE_FACTORY_VERSION ===
            "6.5.0",
        "V6.5 Analyzer Engine 版本錯誤"
    );

    messages.push(
        "✓ V6.5 Analyzer Engine 版本正確"
    );

    let now = 100;

    const calls = [];
    const events = [];

    const analyzer =
        new AnalyzerEngine({
            probability:
                async ({ mode }) => {
                    calls.push(
                        "probability"
                    );

                    return {
                        mode,
                        Player: 0.44,
                        Banker: 0.46,
                        Tie: 0.10
                    };
                },

            ev:
                async ({
                    probability
                }) => {
                    calls.push(
                        "ev"
                    );

                    return {
                        Player:
                            probability.Player -
                            0.45,

                        Banker:
                            probability.Banker -
                            0.455,

                        Tie:
                            probability.Tie -
                            0.095
                    };
                },

            kelly:
                async ({
                    ev
                }) => {
                    calls.push(
                        "kelly"
                    );

                    return {
                        Player:
                            Math.max(
                                0,
                                ev.Player
                            ),

                        Banker:
                            Math.max(
                                0,
                                ev.Banker
                            ),

                        Tie:
                            Math.max(
                                0,
                                ev.Tie
                            )
                    };
                },

            risk:
                async ({
                    kelly
                }) => {
                    calls.push(
                        "risk"
                    );

                    return {
                        level:
                            kelly.Banker > 0
                                ? "low"
                                : "high"
                    };
                },

            confidence:
                async ({
                    probability
                }) => {
                    calls.push(
                        "confidence"
                    );

                    return {
                        overall:
                            probability.Banker
                    };
                },

            ranking:
                async ({
                    ev
                }) => {
                    calls.push(
                        "ranking"
                    );

                    return [
                        {
                            bet:
                                "Banker",
                            ev:
                                ev.Banker
                        },
                        {
                            bet:
                                "Tie",
                            ev:
                                ev.Tie
                        },
                        {
                            bet:
                                "Player",
                            ev:
                                ev.Player
                        }
                    ].sort(
                        (
                            a,
                            b
                        ) =>
                            b.ev -
                            a.ev
                    );
                },

            recommendation:
                async ({
                    ranking,
                    confidence
                }) => {
                    calls.push(
                        "recommendation"
                    );

                    return {
                        action:
                            ranking[0].ev > 0
                                ? "bet"
                                : "skip",

                        bestBet:
                            ranking[0].bet,

                        confidence:
                            confidence.overall
                    };
                },

            resultResolver:
                async result => ({
                    ...result,
                    resolved:
                        true
                }),

            history:
                new AnalysisHistory({
                    limit:
                        10
                }),

            cache:
                new AnalysisCache({
                    limit:
                        10
                }),

            eventBus: {
                emit(type, payload) {
                    events.push({
                        type,
                        payload
                    });
                }
            },

            clock:
                () => now++
        });

    assert(
        analyzer.state ===
            AnalyzerState.IDLE,
        "Analyzer initial state 錯誤"
    );

    const roundResult =
        await analyzer.analyzeRound({
            roundId:
                "shoe-1-round-1",
            winner:
                "Banker"
        });

    assert(
        roundResult.mode ===
            "round" &&
        roundResult.success ===
            true &&
        roundResult.resolved ===
            true &&
        roundResult.probability
            .Banker === 0.46 &&
        roundResult.ev
            .Banker > 0 &&
        roundResult.kelly
            .Banker > 0 &&
        roundResult.risk.level ===
            "low" &&
        roundResult.confidence
            .overall === 0.46 &&
        roundResult.ranking[0]
            .bet === "Banker" &&
        roundResult.recommendation
            .action === "bet" &&
        analyzer.state ===
            AnalyzerState.COMPLETED,
        "Round Analyze 錯誤"
    );

    messages.push(
        "✓ Round Analyze Pipeline 正確"
    );

    assert(
        calls.join(",") ===
            "probability,ev,kelly,risk,confidence,ranking,recommendation",
        "Analyzer Pipeline 順序錯誤"
    );

    messages.push(
        "✓ Probability、EV、Kelly、Risk、Confidence、Ranking、Recommendation 正確"
    );

    const firstAnalysisId =
        roundResult.analysisId;

    const cachedResult =
        await analyzer.analyzeRound({
            roundId:
                "shoe-1-round-1",
            winner:
                "Banker"
        });

    assert(
        cachedResult.analysisId ===
            firstAnalysisId &&
        analyzer.summary
            .cacheHitCount === 1 &&
        analyzer.summary.cache
            .size === 1,
        "Analyzer Cache 錯誤"
    );

    messages.push(
        "✓ Analyzer Cache 正確"
    );

    const shoeResult =
        await analyzer.analyzeShoe({
            shoeNumber:
                1,
            roundCount:
                20
        });

    const sessionResult =
        await analyzer.analyzeSession({
            sessionId:
                "session-1",
            roundCount:
                40
        });

    assert(
        shoeResult.mode ===
            "shoe" &&
        sessionResult.mode ===
            "session" &&
        analyzer.summary
            .analysisCount === 3 &&
        analyzer.summary.history
            .count === 3,
        "Shoe／Session Analyze 或 History 錯誤"
    );

    messages.push(
        "✓ Shoe Analyze、Session Analyze 與 History 正確"
    );

    const adapter =
        new AnalyzerEngineRuntimeAdapter({
            analyzer
        });

    const adapterResult =
        await adapter.analyzeRound({
            roundId:
                "adapter-round"
        });

    assert(
        adapterResult.mode ===
            "round" &&
        adapter.summary.analyzer
            .hasResult === true,
        "Analyzer Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        events.some(
            event =>
                event.type ===
                AnalyzerEvent.STARTED
        ) &&
        events.some(
            event =>
                event.type ===
                AnalyzerEvent.PROBABILITY_COMPLETED
        ) &&
        events.some(
            event =>
                event.type ===
                AnalyzerEvent.RECOMMENDATION_COMPLETED
        ) &&
        events.some(
            event =>
                event.type ===
                AnalyzerEvent.COMPLETED
        ) &&
        events.some(
            event =>
                event.type ===
                AnalyzerEvent.CACHE_HIT
        ),
        "Analyzer Events 錯誤"
    );

    messages.push(
        "✓ Analyzer Events 正確"
    );

    analyzer.reset();

    assert(
        analyzer.state ===
            AnalyzerState.IDLE &&
        analyzer.summary
            .hasResult === false,
        "Analyzer reset 錯誤"
    );

    analyzer.clearCache();

    assert(
        analyzer.summary.cache
            .size === 0,
        "Analyzer clearCache 錯誤"
    );

    messages.push(
        "✓ Reset 與 clearCache 正確"
    );

    assert(
        analyzer.summary.version ===
            "6.5.0" &&
        analyzer.summary.lastError ===
            null,
        "Analyzer summary 錯誤"
    );

    analyzer.destroy();

    assert(
        analyzer.state ===
            AnalyzerState.DESTROYED &&
        analyzer.summary.destroyed ===
            true &&
        analyzer.summary.history
            .count === 0 &&
        analyzer.summary.cache
            .size === 0,
        "Analyzer destroy 錯誤"
    );

    messages.push(
        "✓ Summary 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

Analyzer Engine V6.5 測試完成

Round Analyze：通過
Shoe Analyze：通過
Session Analyze：通過
Probability：通過
EV：通過
Kelly：通過
Risk：通過
Confidence：通過
Ranking：通過
Recommendation：通過
Cache：通過
History：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
