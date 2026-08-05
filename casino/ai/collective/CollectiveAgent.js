/**
 * Baccarat Analyzer V8.3
 * casino/ai/collective/CollectiveAgent.js
 */

export const COLLECTIVE_AGENT_VERSION = "8.3.0";

export default class CollectiveAgent {
    constructor({
        agentId,
        name,
        role,
        expertise = [],
        weight = 1,
        deliberate,
        metadata = {}
    } = {}) {
        if (
            typeof agentId !== "string" ||
            agentId.length === 0
        ) {
            throw new TypeError(
                "CollectiveAgent agentId is required."
            );
        }

        if (
            typeof deliberate !== "function"
        ) {
            throw new TypeError(
                "CollectiveAgent deliberate must be a function."
            );
        }

        this.version = COLLECTIVE_AGENT_VERSION;
        this.agentId = agentId;
        this.name = name ?? agentId;
        this.role = role;
        this.expertise = [...expertise];
        this.weight = Number.isFinite(weight)
            ? weight
            : 1;
        this.deliberate = deliberate;
        this.metadata = { ...metadata };
        this.contributionCount = 0;
    }

    async contribute({
        task,
        context
    } = {}) {
        this.contributionCount++;

        const output =
            await this.deliberate({
                task,
                context,
                agent: this
            });

        return {
            agentId: this.agentId,
            name: this.name,
            role: this.role,
            weight: this.weight,
            expertise: [...this.expertise],
            opinion:
                output?.opinion ??
                output?.value ??
                output,
            confidence:
                Number.isFinite(
                    output?.confidence
                )
                    ? output.confidence
                    : 1,
            evidence:
                Array.isArray(output?.evidence)
                    ? [...output.evidence]
                    : [],
            rationale:
                output?.rationale ??
                null,
            metadata:
                output?.metadata ??
                null
        };
    }
}
