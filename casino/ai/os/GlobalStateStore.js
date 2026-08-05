/**
 * Baccarat Analyzer V9.0
 * casino/ai/os/GlobalStateStore.js
 */
export const GLOBAL_STATE_STORE_VERSION = "9.0.0";

export default class GlobalStateStore {
    constructor(initialState = {}) {
        this.state = { ...initialState };
        this.revision = 0;
    }

    update(patch = {}) {
        this.state = {
            ...this.state,
            ...patch
        };

        this.revision++;

        return this.snapshot();
    }

    replace(nextState = {}) {
        this.state = { ...nextState };
        this.revision++;

        return this.snapshot();
    }

    snapshot() {
        return {
            version:
                GLOBAL_STATE_STORE_VERSION,
            revision:
                this.revision,
            state:
                { ...this.state }
        };
    }

    reset() {
        this.state = {};
        this.revision = 0;
        return this;
    }
}
