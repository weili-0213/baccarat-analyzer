/**
 * Baccarat Analyzer V7.2
 * casino/ai/knowledge/KnowledgeState.js
 */

export const KNOWLEDGE_STATE_VERSION = "7.2.0";

export const KnowledgeState = Object.freeze({
    IDLE: "idle",
    COLLECTING: "collecting",
    INDEXING: "indexing",
    INFERRING: "inferring",
    READY: "ready",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const KnowledgeType = Object.freeze({
    RULE: "rule",
    PATTERN: "pattern",
    EXPERIENCE: "experience",
    RELATION: "relation",
    FACT: "fact"
});
