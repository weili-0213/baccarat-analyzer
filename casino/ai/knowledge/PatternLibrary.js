/**
 * Baccarat Analyzer V7.2
 * casino/ai/knowledge/PatternLibrary.js
 */

export const PATTERN_LIBRARY_VERSION = "7.2.0";

export default class PatternLibrary {
    constructor() {
        this.patterns =
            new Map();
    }

    register({
        name,
        matcher,
        weight = 1,
        description = ""
    } = {}) {
        if (
            typeof name !== "string" ||
            name.length === 0
        ) {
            throw new TypeError(
                "Pattern name is required."
            );
        }

        if (
            typeof matcher !==
                "function"
        ) {
            throw new TypeError(
                "Pattern matcher must be a function."
            );
        }

        this.patterns.set(
            name,
            {
                name,
                matcher,
                weight,
                description,
                matchCount:
                    0
            }
        );

        return this.patterns.get(
            name
        );
    }

    unregister(name) {
        return this.patterns.delete(
            name
        );
    }

    match(context = {}) {
        const matches = [];

        for (
            const pattern of
            this.patterns.values()
        ) {
            const result =
                pattern.matcher(
                    context
                );

            if (result) {
                pattern.matchCount++;

                matches.push({
                    name:
                        pattern.name,

                    weight:
                        pattern.weight,

                    description:
                        pattern.description,

                    result
                });
            }
        }

        return matches;
    }

    clear() {
        this.patterns.clear();

        return this;
    }

    get summary() {
        return {
            version:
                PATTERN_LIBRARY_VERSION,

            count:
                this.patterns.size,

            patterns:
                [
                    ...this.patterns
                        .values()
                ].map(
                    pattern => ({
                        name:
                            pattern.name,

                        weight:
                            pattern.weight,

                        matchCount:
                            pattern.matchCount
                    })
                )
        };
    }
}
