/**
 * Baccarat Analyzer V8.0
 * casino/ai/autonomous/AutonomousContext.js
 */
export const AUTONOMOUS_CONTEXT_VERSION = "8.0.0";
export default class AutonomousContext {
    constructor({
        goal = null,
        task = null,
        decision = null,
        learning = null,
        knowledge = null,
        reasoning = null,
        planning = null,
        execution = null,
        collaboration = null,
        governance = null,
        assurance = null,
        optimization = null,
        runtime = null,
        metadata = {}
    } = {}) {
        this.version = AUTONOMOUS_CONTEXT_VERSION;
        this.goal = goal;
        this.task = task;
        this.decision = decision;
        this.learning = learning;
        this.knowledge = knowledge;
        this.reasoning = reasoning;
        this.planning = planning;
        this.execution = execution;
        this.collaboration = collaboration;
        this.governance = governance;
        this.assurance = assurance;
        this.optimization = optimization;
        this.runtime = runtime;
        this.metadata = { ...metadata };
    }
    merge(data = {}) {
        for (const [key, value] of Object.entries(data)) {
            if (
                value &&
                typeof value === "object" &&
                !Array.isArray(value) &&
                this[key] &&
                typeof this[key] === "object" &&
                !Array.isArray(this[key])
            ) {
                this[key] = { ...this[key], ...value };
            } else {
                this[key] = value;
            }
        }
        return this;
    }
    set(key, value) {
        this[key] = value;
        return this;
    }
    get(key, fallback = null) {
        return this[key] ?? fallback;
    }
    toJSON() {
        return {
            version: this.version,
            goal: this.goal,
            task: this.task,
            decision: this.decision,
            learning: this.learning,
            knowledge: this.knowledge,
            reasoning: this.reasoning,
            planning: this.planning,
            execution: this.execution,
            collaboration: this.collaboration,
            governance: this.governance,
            assurance: this.assurance,
            optimization: this.optimization,
            runtime: this.runtime,
            metadata: { ...this.metadata }
        };
    }
}
