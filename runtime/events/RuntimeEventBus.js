/**
 * Baccarat Analyzer V5.3
 * runtime/events/RuntimeEventBus.js
 *
 * Lightweight application event bus.
 *
 * Features:
 * - on / once / off
 * - wildcard listeners
 * - priority
 * - synchronous and asynchronous emission
 * - middleware
 * - history
 * - pause / resume
 * - error isolation
 */

import {
    RuntimeEventPriority,
    isRuntimeEventType
} from "./RuntimeEvents.js";


export const RUNTIME_EVENT_BUS_VERSION = "5.3.0";


function cloneValue(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return value;
    }

    if (
        typeof structuredClone ===
            "function"
    ) {
        try {
            return structuredClone(
                value
            );
        }
        catch {
            // Fall through.
        }
    }

    try {
        return JSON.parse(
            JSON.stringify(value)
        );
    }
    catch {
        return value;
    }
}


function normalizePriority(value) {
    if (!Number.isFinite(value)) {
        return RuntimeEventPriority.NORMAL;
    }

    return value;
}


export default class RuntimeEventBus {
    constructor({
        clock =
            () =>
                new Date()
                    .toISOString(),

        historyLimit =
            200,

        validateTypes =
            false,

        onListenerError =
            null
    } = {}) {
        if (typeof clock !== "function") {
            throw new TypeError(
                "clock must be a function."
            );
        }

        if (
            !Number.isInteger(historyLimit) ||
            historyLimit < 0
        ) {
            throw new RangeError(
                "historyLimit must be zero or greater."
            );
        }

        this.clock =
            clock;

        this.historyLimit =
            historyLimit;

        this.validateTypes =
            Boolean(validateTypes);

        this.onListenerError =
            onListenerError;

        this.listeners =
            new Map();

        this.middleware =
            [];

        this.history =
            [];

        this.paused =
            false;

        this.queue =
            [];

        this.emittedCount =
            0;

        this.listenerErrorCount =
            0;

        this.destroyed =
            false;

        this.sequence =
            0;
    }

    validateType(type) {
        if (
            typeof type !==
                "string" ||
            type.length === 0
        ) {
            throw new TypeError(
                "Event type must be a non-empty string."
            );
        }

        if (
            this.validateTypes &&
            type !== "*" &&
            !isRuntimeEventType(type)
        ) {
            throw new Error(
                `Unknown runtime event type: ${type}`
            );
        }

        return type;
    }

    on(
        type,
        listener,
        {
            once =
                false,

            priority =
                RuntimeEventPriority.NORMAL
        } = {}
    ) {
        this.assertNotDestroyed();

        this.validateType(type);

        if (typeof listener !== "function") {
            throw new TypeError(
                "Event listener must be a function."
            );
        }

        if (!this.listeners.has(type)) {
            this.listeners.set(
                type,
                new Set()
            );
        }

        const record = {
            listener,
            once:
                Boolean(once),
            priority:
                normalizePriority(
                    priority
                ),
            id:
                ++this.sequence
        };

        this.listeners
            .get(type)
            .add(record);

        return () => {
            this.off(
                type,
                listener
            );
        };
    }

    once(
        type,
        listener,
        options = {}
    ) {
        return this.on(
            type,
            listener,
            {
                ...options,
                once:
                    true
            }
        );
    }

    off(type, listener) {
        const records =
            this.listeners.get(type);

        if (!records) {
            return false;
        }

        let removed =
            false;

        for (const record of records) {
            if (
                record.listener ===
                    listener
            ) {
                records.delete(record);
                removed = true;
            }
        }

        if (records.size === 0) {
            this.listeners.delete(type);
        }

        return removed;
    }

    use(middleware) {
        this.assertNotDestroyed();

        if (typeof middleware !== "function") {
            throw new TypeError(
                "middleware must be a function."
            );
        }

        this.middleware.push(
            middleware
        );

        return () => {
            const index =
                this.middleware
                    .indexOf(middleware);

            if (index >= 0) {
                this.middleware.splice(
                    index,
                    1
                );
            }
        };
    }

    createEvent(
        type,
        payload = null,
        metadata = {}
    ) {
        this.validateType(type);

        return {
            id:
                ++this.sequence,

            type,

            payload:
                cloneValue(payload),

            metadata: {
                ...metadata
            },

            timestamp:
                this.clock()
        };
    }

    applyMiddleware(event) {
        let current =
            event;

        for (const middleware of this.middleware) {
            const next =
                middleware(
                    current
                );

            if (next === false) {
                return null;
            }

            if (
                next &&
                typeof next ===
                    "object"
            ) {
                current =
                    next;
            }
        }

        return current;
    }

    collectListeners(type) {
        return [
            ...(
                this.listeners.get(type) ??
                []
            ),
            ...(
                this.listeners.get("*") ??
                []
            )
        ].sort(
            (a, b) =>
                b.priority -
                    a.priority ||
                a.id -
                    b.id
        );
    }

    recordHistory(event) {
        if (this.historyLimit === 0) {
            return;
        }

        this.history.push(
            cloneValue(event)
        );

        if (
            this.history.length >
            this.historyLimit
        ) {
            this.history.splice(
                0,
                this.history.length -
                    this.historyLimit
            );
        }
    }

    emit(
        type,
        payload = null,
        metadata = {}
    ) {
        this.assertNotDestroyed();

        const event =
            this.applyMiddleware(
                this.createEvent(
                    type,
                    payload,
                    metadata
                )
            );

        if (!event) {
            return null;
        }

        if (this.paused) {
            this.queue.push(event);
            return event;
        }

        this.dispatchSync(event);

        return event;
    }

    async emitAsync(
        type,
        payload = null,
        metadata = {}
    ) {
        this.assertNotDestroyed();

        const event =
            this.applyMiddleware(
                this.createEvent(
                    type,
                    payload,
                    metadata
                )
            );

        if (!event) {
            return null;
        }

        if (this.paused) {
            this.queue.push(event);
            return event;
        }

        await this.dispatchAsync(
            event
        );

        return event;
    }

    dispatchSync(event) {
        this.recordHistory(event);

        this.emittedCount++;

        const records =
            this.collectListeners(
                event.type
            );

        for (const record of records) {
            try {
                record.listener(event);
            }
            catch (error) {
                this.handleListenerError(
                    error,
                    event,
                    record
                );
            }

            if (record.once) {
                this.removeRecord(
                    event.type,
                    record
                );
            }
        }
    }

    async dispatchAsync(event) {
        this.recordHistory(event);

        this.emittedCount++;

        const records =
            this.collectListeners(
                event.type
            );

        for (const record of records) {
            try {
                await record.listener(
                    event
                );
            }
            catch (error) {
                this.handleListenerError(
                    error,
                    event,
                    record
                );
            }

            if (record.once) {
                this.removeRecord(
                    event.type,
                    record
                );
            }
        }
    }

    removeRecord(type, record) {
        const direct =
            this.listeners.get(type);

        direct?.delete(record);

        const wildcard =
            this.listeners.get("*");

        wildcard?.delete(record);
    }

    handleListenerError(
        error,
        event,
        record
    ) {
        this.listenerErrorCount++;

        this.onListenerError?.(
            error,
            {
                event,
                listener:
                    record.listener
            }
        );
    }

    pause() {
        this.paused =
            true;

        return this;
    }

    resume({
        flush =
            true
    } = {}) {
        this.paused =
            false;

        if (flush) {
            this.flushQueue();
        }

        return this;
    }

    flushQueue() {
        if (this.paused) {
            return 0;
        }

        const queued =
            [...this.queue];

        this.queue =
            [];

        for (const event of queued) {
            this.dispatchSync(event);
        }

        return queued.length;
    }

    clearQueue() {
        const count =
            this.queue.length;

        this.queue =
            [];

        return count;
    }

    clearHistory() {
        this.history =
            [];

        return this;
    }

    getHistory({
        type = null,
        limit = null
    } = {}) {
        let result =
            type
                ? this.history.filter(
                    event =>
                        event.type === type
                )
                : [...this.history];

        if (
            Number.isInteger(limit) &&
            limit >= 0
        ) {
            result =
                result.slice(
                    -limit
                );
        }

        return cloneValue(result);
    }

    listenerCount(type = null) {
        if (type !== null) {
            return (
                this.listeners.get(type)
                    ?.size ??
                0
            );
        }

        let count =
            0;

        for (const records of this.listeners.values()) {
            count +=
                records.size;
        }

        return count;
    }

    assertNotDestroyed() {
        if (this.destroyed) {
            throw new Error(
                "RuntimeEventBus has been destroyed."
            );
        }
    }

    destroy() {
        this.listeners.clear();
        this.middleware =
            [];
        this.history =
            [];
        this.queue =
            [];
        this.destroyed =
            true;

        return this;
    }

    get summary() {
        return {
            version:
                RUNTIME_EVENT_BUS_VERSION,

            destroyed:
                this.destroyed,

            paused:
                this.paused,

            listenerCount:
                this.listenerCount(),

            middlewareCount:
                this.middleware.length,

            historyCount:
                this.history.length,

            queuedCount:
                this.queue.length,

            emittedCount:
                this.emittedCount,

            listenerErrorCount:
                this.listenerErrorCount
        };
    }
}
