/**
 * Baccarat Analyzer V9.1
 * ui/ai/AIUIStore.js
 */
export const AI_UI_STORE_VERSION = "9.1.0";

export default class AIUIStore {
    constructor(initialState = {}) {
        this.state = {
            ...initialState
        };

        this.listeners =
            new Set();

        this.revision = 0;
    }

    getState() {
        return {
            revision:
                this.revision,
            ...this.state
        };
    }

    setState(patch = {}) {
        this.state = {
            ...this.state,
            ...patch
        };

        this.revision++;

        const snapshot =
            this.getState();

        for (const listener of this.listeners) {
            listener(snapshot);
        }

        return snapshot;
    }

    subscribe(listener) {
        if (
            typeof listener !==
            "function"
        ) {
            throw new TypeError(
                "AIUIStore listener must be a function."
            );
        }

        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    reset() {
        this.state = {};
        this.revision = 0;
        return this;
    }

    destroy() {
        this.reset();
        this.listeners.clear();
        return this;
    }

    get summary() {
        return {
            version:
                AI_UI_STORE_VERSION,
            revision:
                this.revision,
            listenerCount:
                this.listeners.size
        };
    }
}
