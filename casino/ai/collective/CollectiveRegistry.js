/**
 * Baccarat Analyzer V8.3
 * casino/ai/collective/CollectiveRegistry.js
 */

export const COLLECTIVE_REGISTRY_VERSION = "8.3.0";

export default class CollectiveRegistry {
    constructor() {
        this.agents = new Map();
    }

    register(agent) {
        if (!agent?.agentId) {
            throw new TypeError(
                "CollectiveRegistry requires agentId."
            );
        }

        this.agents.set(
            agent.agentId,
            agent
        );

        return agent;
    }

    get(agentId) {
        return this.agents.get(agentId) ?? null;
    }

    all() {
        return [...this.agents.values()];
    }

    findByExpertise(expertise) {
        return this.all()
            .filter(
                agent =>
                    agent.expertise
                        .includes(
                            expertise
                        )
            )
            .sort(
                (a, b) =>
                    b.weight - a.weight
            );
    }

    unregister(agentId) {
        return this.agents.delete(agentId);
    }

    clear() {
        this.agents.clear();
        return this;
    }

    get summary() {
        return {
            version:
                COLLECTIVE_REGISTRY_VERSION,
            count:
                this.agents.size,
            agents:
                this.all().map(
                    agent => ({
                        agentId:
                            agent.agentId,
                        role:
                            agent.role,
                        weight:
                            agent.weight,
                        expertise:
                            [...agent.expertise],
                        contributionCount:
                            agent.contributionCount
                    })
                )
        };
    }
}
