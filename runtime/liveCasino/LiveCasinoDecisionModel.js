/**
 * Baccarat Analyzer V10.4.4
 * Path: runtime/liveCasino/LiveCasinoDecisionModel.js
 * Purpose: Produces strict + relative live decisions without pretending negative EV is positive EV.
 */
export const LIVE_CASINO_DECISION_MODEL_VERSION = "10.4.4";

const MAIN = Object.freeze([
    ["player", "閒家"],
    ["banker", "莊家"],
    ["tie", "和局"]
]);

function finite(value, fallback = null) {
    return Number.isFinite(value) ? value : fallback;
}

function normalizeKey(value) {
    return String(value ?? "").trim().toLowerCase();
}

function labelFor(key) {
    return MAIN.find(([candidate]) => candidate === key)?.[1] ?? "—";
}

function extractEV(analysis = {}) {
    const source = analysis.ev ?? analysis.expectedValue ?? {};
    return {
        player: finite(source.player ?? source.Player),
        banker: finite(source.banker ?? source.Banker),
        tie: finite(source.tie ?? source.Tie)
    };
}

function extractProbability(analysis = {}) {
    const source =
        analysis.probability ??
        analysis.probabilities ??
        analysis.nextProbability ??
        {};

    return {
        player: finite(source.player ?? source.Player),
        banker: finite(source.banker ?? source.Banker),
        tie: finite(source.tie ?? source.Tie)
    };
}

function rankingCandidate(analysis = {}) {
    const ranking = Array.isArray(analysis.ranking)
        ? analysis.ranking
        : [];

    for (const item of ranking) {
        const key = normalizeKey(
            item?.key ??
            item?.name ??
            item?.bet
        );

        if (MAIN.some(([candidate]) => candidate === key)) {
            return {
                key,
                ev: finite(item.ev),
                confidence:
                    finite(
                        item.confidence ??
                        item.score
                    )
            };
        }
    }

    return null;
}

export default class LiveCasinoDecisionModel {
    build(analysis = null) {
        if (!analysis) {
            return {
                ready: false,
                strictAction: "WAIT",
                strictLabel: "等待分析",
                relativeKey: null,
                relativeLabel: "—",
                reason: "尚未取得下一局分析。",
                probability: extractProbability({}),
                ev: extractEV({}),
                confidence: null,
                amount: 0
            };
        }

        const ev = extractEV(analysis);
        const probability = extractProbability(analysis);
        const recommendation =
            analysis.recommendation ??
            analysis.decision?.recommendation ??
            {};

        const shouldBet =
            recommendation.shouldBet === true ||
            recommendation.action === "bet";

        let relative =
            rankingCandidate(analysis);

        if (!relative) {
            relative = MAIN
                .map(([key]) => ({
                    key,
                    ev: ev[key]
                }))
                .filter(item =>
                    Number.isFinite(item.ev)
                )
                .sort((a, b) => b.ev - a.ev)[0] ??
                null;
        }

        const recommendedKey =
            normalizeKey(
                recommendation.key ??
                recommendation.bet ??
                recommendation.bestBet ??
                recommendation.name
            );

        const strictKey =
            shouldBet &&
            MAIN.some(([key]) => key === recommendedKey)
                ? recommendedKey
                : null;

        const confidence =
            finite(
                recommendation.confidence ??
                analysis.overallConfidence ??
                analysis.confidence?.overall ??
                relative?.confidence
            );

        const amount =
            shouldBet
                ? finite(
                    recommendation.amount ??
                    analysis.amount?.[strictKey],
                    0
                ) ?? 0
                : 0;

        return {
            ready: true,
            strictAction:
                strictKey
                    ? "BET"
                    : "WAIT",
            strictKey,
            strictLabel:
                strictKey
                    ? `下注 ${labelFor(strictKey)}`
                    : "嚴格策略：觀望",
            relativeKey:
                relative?.key ??
                null,
            relativeLabel:
                relative?.key
                    ? labelFor(relative.key)
                    : "—",
            relativeEV:
                finite(relative?.ev),
            reason:
                recommendation.reason ??
                (
                    strictKey
                        ? "符合正期望與風險條件。"
                        : "目前沒有正期望下注；仍顯示相對最佳選項供比較。"
                ),
            probability,
            ev,
            confidence,
            amount
        };
    }
}
