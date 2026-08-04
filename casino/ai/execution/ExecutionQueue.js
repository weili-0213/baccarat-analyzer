/**
 * Baccarat Analyzer V7.5
 * casino/ai/execution/ExecutionQueue.js
 */

export const EXECUTION_QUEUE_VERSION = "7.5.0";

export default class ExecutionQueue {
    constructor() {
        this.items = [];
    }

    enqueue(step) {
        this.items.push(step);
        this.items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        return step;
    }

    dequeue() {
        return this.items.shift() ?? null;
    }

    peek() {
        return this.items[0] ?? null;
    }

    clear() {
        this.items = [];
        return this;
    }

    get size() {
        return this.items.length;
    }

    get summary() {
        return {
            version: EXECUTION_QUEUE_VERSION,
            size: this.size
        };
    }
}
