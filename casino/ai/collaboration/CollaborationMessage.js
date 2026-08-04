/**
 * Baccarat Analyzer V7.6
 * casino/ai/collaboration/CollaborationMessage.js
 */

import {
    MessageType
} from "./CollaborationState.js";

export const COLLABORATION_MESSAGE_VERSION = "7.6.0";

export default class CollaborationMessage {
    constructor({
        messageId,
        type = MessageType.REQUEST,
        from = "collaboration-engine",
        to = null,
        topic = null,
        payload = null,
        correlationId = null,
        timestamp = null,
        metadata = {}
    } = {}) {
        if (
            typeof messageId !== "string" ||
            messageId.length === 0
        ) {
            throw new TypeError(
                "CollaborationMessage messageId is required."
            );
        }

        this.version =
            COLLABORATION_MESSAGE_VERSION;

        this.messageId = messageId;
        this.type = type;
        this.from = from;
        this.to = to;
        this.topic = topic;
        this.payload = payload;
        this.correlationId = correlationId;
        this.timestamp = timestamp;
        this.metadata = { ...metadata };
    }

    toJSON() {
        return {
            version: this.version,
            messageId: this.messageId,
            type: this.type,
            from: this.from,
            to: this.to,
            topic: this.topic,
            payload: this.payload,
            correlationId: this.correlationId,
            timestamp: this.timestamp,
            metadata: { ...this.metadata }
        };
    }
}
