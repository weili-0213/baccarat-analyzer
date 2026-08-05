/**
 * Baccarat Analyzer V8.3
 * casino/ai/collective/ContributionCollector.js
 */

export const CONTRIBUTION_COLLECTOR_VERSION = "8.3.0";

export default class ContributionCollector {
    async collect({
        agents = [],
        task,
        context,
        parallel = true
    } = {}) {
        const run =
            agent =>
                agent.contribute({
                    task,
                    context
                });

        if (parallel) {
            return Promise.all(
                agents.map(run)
            );
        }

        const contributions = [];

        for (const agent of agents) {
            contributions.push(
                await run(agent)
            );
        }

        return contributions;
    }

    get summary() {
        return {
            version:
                CONTRIBUTION_COLLECTOR_VERSION
        };
    }
}
