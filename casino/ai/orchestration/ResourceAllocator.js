/**
 * Baccarat Analyzer V8.9
 * casino/ai/orchestration/ResourceAllocator.js
 */
export const RESOURCE_ALLOCATOR_VERSION = "8.9.0";

export default class ResourceAllocator {
    allocate({
        tasks = [],
        capacity = Infinity
    } = {}) {
        let remaining =
            Number.isFinite(capacity)
                ? capacity
                : Infinity;

        const allocated = [];
        const deferred = [];

        for (const task of tasks) {
            const cost =
                task.resourceCost ??
                1;

            if (cost <= remaining) {
                allocated.push(task);
                remaining -= cost;
            } else {
                deferred.push(task);
            }
        }

        return {
            allocated,
            deferred,
            remaining
        };
    }

    get summary() {
        return {
            version:
                RESOURCE_ALLOCATOR_VERSION
        };
    }
}
