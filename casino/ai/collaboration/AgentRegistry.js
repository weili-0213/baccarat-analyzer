/**
 * Baccarat Analyzer V7.6
 * casino/ai/collaboration/AgentRegistry.js
 */

import {
    AgentStatus
} from "./CollaborationState.js";

export const AGENT_REGISTRY_VERSION = "7.6.0";

export default class AgentRegistry {
    constructor() {
        this.agents = new Map();
    }

    register({
        agentId,
        name,
        capabilities = [],
        handler,
        priority = 0,
        status = AgentStatus.READY,
        metadata = {}
    } = {}) {
        if (
            typeof agentId !== "string" ||
            agentId.length === 0
        ) {
            throw new TypeError(
                "Agent agentId is required."
            );
        }

        if (
            typeof handler !== "function"
        ) {
            throw new TypeError(
                "Agent handler must be a function."
            );
        }

        const agent = {
            agentId,
            name: name ?? agentId,
            capabilities: [...capabilities],
            handler,
            priority,
            status,
            metadata: { ...metadata },
            taskCount: 0,
            errorCount: 0
        };

        this.agents.set(
            agentId,
            agent
        );

        return agent;
    }

    get(agentId) {
        return this.agents.get(agentId) ?? null;
    }

    findByCapability(capability) {
        return [...this.agents.values()]
            .filter(
                agent =>
                    agent.status !== AgentStatus.OFFLINE &&
                    agent.capabilities.includes(capability)
            )
            .sort(
                (a, b) =>
                    b.priority - a.priority
            );
    }

    setStatus(agentId, status) {
        const agent = this.get(agentId);

        if (!agent) {
            return false;
        }

        agent.status = status;
        return true;
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
            version: AGENT_REGISTRY_VERSION,
            count: this.agents.size,
            readyCount: [...this.agents.values()]
                .filter(
                    agent =>
                        agent.status === AgentStatus.READY
                )
                .length,
            agents: [...this.agents.values()]
                .map(
                    agent => ({
                        agentId: agent.agentId,
                        name: agent.name,
                        capabilities: [...agent.capabilities],
                        priority: agent.priority,
                        status: agent.status,
                        taskCount: agent.taskCount,
                        errorCount: agent.errorCount
                    })
                )
        };
    }
}
