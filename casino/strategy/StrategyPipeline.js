/**
 * Baccarat Analyzer V6.9
 * casino/strategy/StrategyPipeline.js
 */

import StrategyRule
    from "./StrategyRule.js";


export const STRATEGY_PIPELINE_VERSION = "6.9.0";


export default class StrategyPipeline {
    constructor({
        rules = []
    } = {}) {
        this.rules = [];

        for (const rule of rules) {
            this.register(rule);
        }

        this.executionCount = 0;
        this.lastResults = [];
    }

    register(rule) {
        if (!(rule instanceof StrategyRule)) {
            rule =
                new StrategyRule(
                    rule
                );
        }

        if (
            this.rules.some(
                item =>
                    item.name ===
                    rule.name
            )
        ) {
            throw new Error(
                `Strategy rule already exists: ${rule.name}`
            );
        }

        this.rules.push(rule);

        this.rules.sort(
            (
                a,
                b
            ) =>
                b.priority -
                a.priority
        );

        return rule;
    }

    unregister(name) {
        const index =
            this.rules.findIndex(
                rule =>
                    rule.name === name
            );

        if (index < 0) {
            return false;
        }

        this.rules.splice(
            index,
            1
        );

        return true;
    }

    getRule(name) {
        return (
            this.rules.find(
                rule =>
                    rule.name === name
            ) ??
            null
        );
    }

    async execute(context = {}) {
        this.executionCount++;

        const results = [];

        for (const rule of this.rules) {
            const result =
                await rule.run(
                    context
                );

            results.push(result);

            if (
                result.matched &&
                result.stop
            ) {
                break;
            }
        }

        this.lastResults =
            results;

        return results;
    }

    clear() {
        this.rules = [];
        this.lastResults = [];

        return this;
    }

    get summary() {
        return {
            version:
                STRATEGY_PIPELINE_VERSION,

            ruleCount:
                this.rules.length,

            executionCount:
                this.executionCount,

            rules:
                this.rules.map(
                    rule =>
                        rule.summary
                ),

            lastResults:
                this.lastResults
        };
    }
}
