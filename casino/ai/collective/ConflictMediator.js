/**
 * Baccarat Analyzer V8.3
 * casino/ai/collective/ConflictMediator.js
 */

export const CONFLICT_MEDIATOR_VERSION = "8.3.0";

export default class ConflictMediator {
    mediate(deliberation = {}) {
        const ranking =
            deliberation.ranking ??
            [];

        const first =
            ranking[0] ??
            null;

        const second =
            ranking[1] ??
            null;

        const margin =
            first && second
                ? first.score -
                    second.score
                : first
                    ? first.score
                    : 0;

        return {
            conflict:
                Boolean(
                    first &&
                    second &&
                    margin <
                    0.25
                ),
            margin,
            recommended:
                first
        };
    }

    get summary() {
        return {
            version:
                CONFLICT_MEDIATOR_VERSION
        };
    }
}
