/**
 * Baccarat Analyzer V8.9
 * casino/ai/orchestration/GlobalStateSynchronizer.js
 */
export const GLOBAL_STATE_SYNCHRONIZER_VERSION = "8.9.0";

export default class GlobalStateSynchronizer {
    synchronize({
        globalState = {},
        results = []
    } = {}) {
        const nextState = {
            ...globalState,
            lastExecutionCount:
                results.length,
            successfulTasks:
                results.filter(
                    result =>
                        result.success
                ).map(
                    result =>
                        result.taskId
                ),
            failedTasks:
                results.filter(
                    result =>
                        !result.success
                ).map(
                    result =>
                        result.taskId
                ),
            updatedAt:
                Date.now()
        };

        return nextState;
    }

    get summary() {
        return {
            version:
                GLOBAL_STATE_SYNCHRONIZER_VERSION
        };
    }
}
