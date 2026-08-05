/**
 * Baccarat Analyzer V8.9
 * casino/ai/orchestration/TaskPrioritizer.js
 */
export const TASK_PRIORITIZER_VERSION = "8.9.0";

export default class TaskPrioritizer {
    prioritize(tasks = []) {
        const ranking =
            [...tasks]
                .sort(
                    (a, b) =>
                        b.priority -
                        a.priority
                );

        return {
            ranking,
            highest:
                ranking[0] ??
                null
        };
    }

    get summary() {
        return {
            version:
                TASK_PRIORITIZER_VERSION
        };
    }
}
