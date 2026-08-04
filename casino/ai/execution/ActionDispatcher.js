/**
 * Baccarat Analyzer V7.5
 * casino/ai/execution/ActionDispatcher.js
 */

export const ACTION_DISPATCHER_VERSION = "7.5.0";

export default class ActionDispatcher {
    constructor() {
        this.handlers = new Map();
    }

    register(action, handler) {
        if (typeof action !== "string" || action.length === 0) {
            throw new TypeError("Action name is required.");
        }

        if (typeof handler !== "function") {
            throw new TypeError("Action handler must be a function.");
        }

        this.handlers.set(action, handler);

        return this;
    }

    unregister(action) {
        return this.handlers.delete(action);
    }

    has(action) {
        return this.handlers.has(action);
    }

    async dispatch(action, payload = {}, context = {}) {
        const handler = this.handlers.get(action);

        if (!handler) {
            throw new Error(`No execution handler for action: ${action}`);
        }

        return handler(payload, context);
    }

    clear() {
        this.handlers.clear();

        return this;
    }

    get summary() {
        return {
            version: ACTION_DISPATCHER_VERSION,
            handlerCount: this.handlers.size,
            actions: [...this.handlers.keys()]
        };
    }
}
