/**
 * Baccarat Analyzer V7.3
 * casino/ai/reasoning/ReasoningChain.js
 */
export const REASONING_CHAIN_VERSION = "7.3.0";
export default class ReasoningChain {
    constructor({ limit = 100 } = {}) {
        if (!Number.isInteger(limit) || limit < 1) {
            throw new RangeError("ReasoningChain limit must be positive.");
        }
        this.limit = limit;
        this.steps = [];
    }
    add({
        type,
        message,
        data = null,
        confidence = null,
        timestamp = null
    } = {}) {
        const step = {
            index: this.steps.length + 1,
            type,
            message,
            data,
            confidence: Number.isFinite(confidence) ? confidence : null,
            timestamp
        };
        this.steps.push(step);
        if (this.steps.length > this.limit) {
            this.steps.splice(0, this.steps.length - this.limit);
        }
        return step;
    }
    latest() {
        return this.steps[this.steps.length - 1] ?? null;
    }
    clear() {
        this.steps = [];
        return this;
    }
    toJSON() {
        return {
            version: REASONING_CHAIN_VERSION,
            count: this.steps.length,
            steps: this.steps.map(step => ({ ...step }))
        };
    }
    get summary() {
        return this.toJSON();
    }
}
