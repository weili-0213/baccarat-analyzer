/**
 * Baccarat Analyzer V7.2
 * casino/ai/knowledge/RuleRepository.js
 */

export const RULE_REPOSITORY_VERSION = "7.2.0";

export default class RuleRepository {
    constructor() {
        this.rules =
            new Map();
    }

    register({
        name,
        priority = 0,
        evaluate,
        enabled = true
    } = {}) {
        if (
            typeof name !== "string" ||
            name.length === 0
        ) {
            throw new TypeError(
                "Rule name is required."
            );
        }

        if (
            typeof evaluate !==
                "function"
        ) {
            throw new TypeError(
                "Rule evaluate must be a function."
            );
        }

        this.rules.set(
            name,
            {
                name,
                priority,
                evaluate,
                enabled:
                    Boolean(enabled),
                executionCount:
                    0
            }
        );

        return this.rules.get(
            name
        );
    }

    unregister(name) {
        return this.rules.delete(
            name
        );
    }

    evaluate(context = {}) {
        const ordered =
            [
                ...this.rules.values()
            ].sort(
                (
                    a,
                    b
                ) =>
                    b.priority -
                    a.priority
            );

        const results = [];

        for (const rule of ordered) {
            if (!rule.enabled) {
                continue;
            }

            rule.executionCount++;

            const result =
                rule.evaluate(
                    context
                );

            results.push({
                rule:
                    rule.name,

                priority:
                    rule.priority,

                result
            });
        }

        return results;
    }

    clear() {
        this.rules.clear();

        return this;
    }

    get summary() {
        return {
            version:
                RULE_REPOSITORY_VERSION,

            count:
                this.rules.size,

            rules:
                [
                    ...this.rules
                        .values()
                ].map(
                    rule => ({
                        name:
                            rule.name,

                        priority:
                            rule.priority,

                        enabled:
                            rule.enabled,

                        executionCount:
                            rule.executionCount
                    })
                )
        };
    }
}
