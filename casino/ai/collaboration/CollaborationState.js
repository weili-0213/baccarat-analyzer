/**
 * Baccarat Analyzer V7.6
 * casino/ai/collaboration/CollaborationState.js
 */

export const COLLABORATION_STATE_VERSION = "7.6.0";

export const CollaborationState = Object.freeze({
    IDLE: "idle",
    COORDINATING: "coordinating",
    ROUTING: "routing",
    VOTING: "voting",
    RESOLVING: "resolving",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const AgentStatus = Object.freeze({
    IDLE: "idle",
    READY: "ready",
    BUSY: "busy",
    OFFLINE: "offline",
    ERROR: "error"
});

export const MessageType = Object.freeze({
    REQUEST: "request",
    RESPONSE: "response",
    EVENT: "event",
    VOTE: "vote",
    RESULT: "result",
    ERROR: "error"
});
