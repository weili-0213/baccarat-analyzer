/**
 * Baccarat Analyzer V3.6
 * analysis/pipeline/RankingPipeline.js
 */

import {
    MAIN_RECOMMENDATION_BETS
} from "../ranking.js";

export const RANKING_PIPELINE_VERSION = "3.6.0";

function isObject(value) {
    return value !== null &&
        typeof value === "object" &&
        !Array.isArray(value);
}

function finiteOr(value, fallback = 0) {
    return Number.isFinite(value)
        ? value
        : fallback;
}

export default class RankingPipeline {
    constructor({
        engine,
        betConfig,
        allowedNames = MAIN_RECOMMENDATION_BETS,
        topCount = 3
    } = {}) {
        if (!engine || typeof engine.calculate !== "function") {
            throw new Error(
                "RankingPipeline requires a Ranking engine."
            );
        }

        if (!isObject(betConfig)) {
            throw new TypeError(
                "RankingPipeline requires betConfig."
            );
        }

        if (!Array.isArray(allowedNames) || allowedNames.length === 0) {
            throw new TypeError(
                "allowedNames must be a non-empty array."
            );
        }

        if (!Number.isInteger(topCount) || topCount < 1) {
            throw new RangeError(
                "topCount must be a positive integer."
            );
        }

        this.engine = engine;
        this.betConfig = betConfig;
        this.allowedNames = [...allowedNames];
        this.topCount = topCount;
    }

    buildItem(name, state) {
        return {
            probability:
                finiteOr(state.probability?.[name]),
            ev:
                finiteOr(state.ev?.[name]),
            evStatus:
                state.evStatus?.[name] ?? "available",
            kelly:
                finiteOr(state.kelly?.[name]),
            fullKelly:
                finiteOr(state.fullKelly?.[name]),
            amount:
                finiteOr(state.amount?.[name]),
            risk:
                finiteOr(state.risk?.[name]),
            riskLevel:
                state.riskLevel?.[name] ?? null,
            riskLabel:
                state.riskLabel?.[name] ?? null,
            confidence:
                finiteOr(state.confidence?.[name]),
            confidenceLevel:
                state.confidenceLevel?.[name] ?? null,
            confidenceLabel:
                state.confidenceLabel?.[name] ?? null,
            confidenceProvisional:
                Boolean(
                    state.confidenceProvisional?.[name]
                ),
            recommendationEligible:
                this.allowedNames.includes(name) &&
                state.evStatus?.[name] !== "unavailable"
        };
    }

    buildRankingInput(state) {
        const result = {};

        for (const name of Object.keys(this.betConfig)) {
            if (!this.allowedNames.includes(name)) {
                continue;
            }

            result[name] = this.buildItem(
                name,
                state
            );
        }

        return result;
    }

    run({ state }) {
        for (const key of [
            "probability",
            "ev",
            "kelly",
            "risk",
            "confidence"
        ]) {
            if (!isObject(state[key])) {
                throw new Error(
                    `RankingPipeline requires state.${key}.`
                );
            }
        }

        const rankingInput =
            this.buildRankingInput(state);

        const ranking =
            this.engine.calculate(
                rankingInput
            );

        if (!Array.isArray(ranking)) {
            throw new TypeError(
                "Ranking engine calculate() must return an array."
            );
        }

        const best =
            ranking.find(
                item =>
                    item.eligible &&
                    this.allowedNames.includes(item.name)
            ) ?? null;

        const topRanking =
            ranking
                .filter(item => item.eligible)
                .slice(0, this.topCount);

        const rejectedRanking =
            ranking.filter(item => !item.eligible);

        return {
            rankingInput,
            ranking,
            mainRanking: ranking,
            best,
            topRanking,
            rejectedRanking,
            bestEV:
                best?.ev ?? null,
            bestProbability:
                best?.probability ?? null
        };
    }

    toDefinition({
        name = "ranking",
        priority = 50
    } = {}) {
        return {
            name,
            priority,
            requires: [
                "probability",
                "ev",
                "kelly",
                "risk",
                "confidence"
            ],
            run:
                context =>
                    this.run(context),
            metadata: {
                version:
                    RANKING_PIPELINE_VERSION,
                type: "ranking"
            }
        };
    }

    get summary() {
        return {
            version:
                RANKING_PIPELINE_VERSION,
            bets:
                Object.keys(this.betConfig).length,
            allowedNames:
                [...this.allowedNames],
            topCount:
                this.topCount
        };
    }
}
