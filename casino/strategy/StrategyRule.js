/**
 * Baccarat Analyzer V6.9
 * casino/strategy/StrategyRule.js
 */

export const STRATEGY_RULE_VERSION = "6.9.0";

export default class StrategyRule {
    constructor({
        name,
        priority = 0,
        enabled = true,
        evaluate,
        stopOnMatch = false
    } = {}) {
        if (
            typeof name !== "string" ||
            name.length === 0
        ) {
            throw new TypeError(
                "StrategyRule name must be a non-empty string."
            );
        }

        if (typeof evaluate !== "function") {
            throw new TypeError(
                "StrategyRule requires evaluate()."
            );
        }

        this.name = name;
        this.priority = priority;
        this.enabled = Boolean(enabled);
        this.evaluate = evaluate;
        this.stopOnMatch =
            Boolean(stopOnMatch);

        this.executionCount = 0;
        this.matchCount = 0;
        this.lastResult = null;
    }

    async run(context) {
        if (!this.enabled) {
            return {
                matched: false,
                skipped: true,
                rule:
                    this.name
            };
        }

        this.executionCount++;

        const result =
            await this.evaluate(
                context
            );

        const normalized = {
            matched:
                Boolean(
                    result?.matched
                ),

            passed:
                result?.passed ??
                true,

            action:
                result?.action ??
                null,

            reason:
                result?.reason ??
                null,

            data:
                result?.data ??
                null,

            stop:
                result?.stop ??
                this.stopOnMatch,

            rule:
                this.name
        };

        if (normalized.matched) {
            this.matchCount++;
        }

        this.lastResult =
            normalized;

        return normalized;
    }

    get summary() {
        return {
            version:
                STRATEGY_RULE_VERSION,

            name:
                this.name,

            priority:
                this.priority,

            enabled:
                this.enabled,

            executionCount:
                this.executionCount,

            matchCount:
                this.matchCount,

            lastResult:
                this.lastResult
        };
    }
}
