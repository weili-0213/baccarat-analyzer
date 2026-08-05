/**
 * Baccarat Analyzer V8.9
 * casino/ai/orchestration/ExecutionCoordinator.js
 */
export const EXECUTION_COORDINATOR_VERSION = "8.9.0";

export default class ExecutionCoordinator {
    async execute({
        schedule = [],
        engines = {}
    } = {}) {
        const results = [];

        for (const item of schedule) {
            const engine =
                engines[
                    item.engineId
                ];

            if (
                !engine ||
                typeof engine.execute !==
                    "function"
            ) {
                throw new Error(
                    `Engine ${item.engineId} is unavailable.`
                );
            }

            const output =
                await engine.execute(
                    item.payload,
                    item
                );

            results.push({
                sequence:
                    item.sequence,
                taskId:
                    item.taskId,
                engineId:
                    item.engineId,
                output,
                success:
                    output?.success !==
                    false
            });
        }

        return results;
    }

    get summary() {
        return {
            version:
                EXECUTION_COORDINATOR_VERSION
        };
    }
}
