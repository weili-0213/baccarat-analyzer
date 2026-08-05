/**
 * Baccarat Analyzer V8.5
 * casino/ai/alignment/AlignmentConflictResolver.js
 */

export const ALIGNMENT_CONFLICT_RESOLVER_VERSION = "8.5.0";

export default class AlignmentConflictResolver {
    resolve({
        goalResults = [],
        actionResults = []
    } = {}) {
        const conflicts = [
            ...goalResults
                .filter(
                    item =>
                        !item.aligned
                )
                .map(
                    item => ({
                        type:
                            "goal",
                        id:
                            item.goalId,
                        violations:
                            item.violations
                    })
                ),
            ...actionResults
                .filter(
                    item =>
                        !item.aligned
                )
                .map(
                    item => ({
                        type:
                            "action",
                        id:
                            item.actionId,
                        violations:
                            item.violations
                    })
                )
        ];

        return {
            hasConflict:
                conflicts.length > 0,
            conflicts,
            recommendation:
                conflicts.length === 0
                    ? "proceed"
                    : "revise"
        };
    }

    get summary() {
        return {
            version:
                ALIGNMENT_CONFLICT_RESOLVER_VERSION
        };
    }
}
