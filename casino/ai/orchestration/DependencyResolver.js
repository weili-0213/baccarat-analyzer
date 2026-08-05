/**
 * Baccarat Analyzer V8.9
 * casino/ai/orchestration/DependencyResolver.js
 */
export const DEPENDENCY_RESOLVER_VERSION = "8.9.0";

export default class DependencyResolver {
    resolve(tasks = []) {
        const taskMap =
            new Map(
                tasks.map(
                    task => [
                        task.taskId,
                        task
                    ]
                )
            );

        const visiting = new Set();
        const visited = new Set();
        const ordered = [];

        const visit = task => {
            if (visited.has(task.taskId)) {
                return;
            }

            if (visiting.has(task.taskId)) {
                throw new Error(
                    `Circular dependency detected at ${task.taskId}.`
                );
            }

            visiting.add(task.taskId);

            for (const dependencyId of task.dependencies) {
                const dependency =
                    taskMap.get(
                        dependencyId
                    );

                if (!dependency) {
                    throw new Error(
                        `Missing dependency ${dependencyId}.`
                    );
                }

                visit(dependency);
            }

            visiting.delete(task.taskId);
            visited.add(task.taskId);
            ordered.push(task);
        };

        for (const task of tasks) {
            visit(task);
        }

        return {
            ordered,
            count:
                ordered.length
        };
    }

    get summary() {
        return {
            version:
                DEPENDENCY_RESOLVER_VERSION
        };
    }
}
