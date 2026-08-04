/**
 * Baccarat Analyzer V7.6
 * casino/ai/collaboration/AgentMessageBus.js
 */

export const AGENT_MESSAGE_BUS_VERSION = "7.6.0";

export default class AgentMessageBus {
    constructor({
        limit = 1000
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "AgentMessageBus limit must be positive."
            );
        }

        this.limit = limit;
        this.messages = [];
        this.listeners = new Map();
    }

    publish(message) {
        this.messages.push(message);

        if (
            this.messages.length >
            this.limit
        ) {
            this.messages.splice(
                0,
                this.messages.length -
                    this.limit
            );
        }

        const listeners = [
            ...(this.listeners.get(message.topic) ?? []),
            ...(this.listeners.get("*") ?? [])
        ];

        for (const listener of listeners) {
            listener(message);
        }

        return message;
    }

    subscribe(topic, listener) {
        if (
            typeof listener !== "function"
        ) {
            throw new TypeError(
                "Message listener must be a function."
            );
        }

        const set =
            this.listeners.get(topic) ??
            new Set();

        set.add(listener);
        this.listeners.set(topic, set);

        return () => {
            set.delete(listener);

            if (set.size === 0) {
                this.listeners.delete(topic);
            }
        };
    }

    latest() {
        return (
            this.messages[
                this.messages.length - 1
            ] ??
            null
        );
    }

    clear() {
        this.messages = [];
        this.listeners.clear();

        return this;
    }

    get summary() {
        return {
            version: AGENT_MESSAGE_BUS_VERSION,
            limit: this.limit,
            messageCount: this.messages.length,
            topicCount: this.listeners.size
        };
    }
}
