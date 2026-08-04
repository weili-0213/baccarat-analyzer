/**
 * Baccarat Analyzer V7.6
 * casino/ai/collaboration/TaskRouter.js
 */

export const TASK_ROUTER_VERSION = "7.6.0";

export default class TaskRouter {
    route({
        task,
        registry
    } = {}) {
        if (!task) {
            throw new TypeError(
                "TaskRouter requires task."
            );
        }

        if (!registry) {
            throw new TypeError(
                "TaskRouter requires registry."
            );
        }

        const capability =
            task.capability ??
            task.type ??
            null;

        const candidates =
            capability
                ? registry.findByCapability(
                    capability
                )
                : [];

        return {
            capability,
            candidates,
            selected:
                candidates[0] ??
                null
        };
    }

    get summary() {
        return {
            version: TASK_ROUTER_VERSION
        };
    }
}
