/**
 * Baccarat Analyzer V5.3
 * runtime/events/RuntimeEventBridge.js
 *
 * Bridges CasinoRuntime and RuntimeController activity
 * into RuntimeEventBus events.
 */

import {
    RuntimeEventType
} from "./RuntimeEvents.js";


export const RUNTIME_EVENT_BRIDGE_VERSION = "5.3.0";


export default class RuntimeEventBridge {
    constructor({
        eventBus,
        runtime = null,
        controller = null
    } = {}) {
        if (
            !eventBus ||
            typeof eventBus.emit !==
                "function"
        ) {
            throw new TypeError(
                "RuntimeEventBridge requires eventBus.emit()."
            );
        }

        this.eventBus =
            eventBus;

        this.runtime =
            runtime;

        this.controller =
            controller;

        this.unsubscribers =
            [];

        this.bound =
            false;
    }

    bindRuntime(runtime = this.runtime) {
        if (
            !runtime ||
            typeof runtime.on !==
                "function"
        ) {
            return this;
        }

        this.runtime =
            runtime;

        const mappings = [
            [
                "runtime:start",
                RuntimeEventType.RUNTIME_STARTED
            ],
            [
                "runtime:stop",
                RuntimeEventType.RUNTIME_STOPPED
            ],
            [
                "runtime:pause",
                RuntimeEventType.RUNTIME_PAUSED
            ],
            [
                "runtime:resume",
                RuntimeEventType.RUNTIME_RESUMED
            ],
            [
                "runtime:round-start",
                RuntimeEventType.ROUND_STARTED
            ],
            [
                "runtime:round-complete",
                RuntimeEventType.ROUND_COMPLETED
            ],
            [
                "runtime:analysis-start",
                RuntimeEventType.ANALYSIS_STARTED
            ],
            [
                "runtime:analysis-complete",
                RuntimeEventType.ANALYSIS_COMPLETED
            ],
            [
                "runtime:dashboard-update",
                RuntimeEventType.DASHBOARD_UPDATED
            ],
            [
                "runtime:error",
                RuntimeEventType.ERROR
            ],
            [
                "runtime:destroy",
                RuntimeEventType.RUNTIME_DESTROYED
            ]
        ];

        for (const [source, target] of mappings) {
            const unsubscribe =
                runtime.on(
                    source,
                    event => {
                        this.eventBus.emit(
                            target,
                            event.payload,
                            {
                                source:
                                    "casino-runtime",
                                originalType:
                                    source
                            }
                        );
                    }
                );

            if (
                typeof unsubscribe ===
                    "function"
            ) {
                this.unsubscribers.push(
                    unsubscribe
                );
            }
        }

        this.bound =
            true;

        return this;
    }

    emitCommandStarted(
        command,
        payload = {}
    ) {
        return this.eventBus.emit(
            RuntimeEventType.COMMAND_STARTED,
            {
                command,
                payload
            },
            {
                source:
                    "runtime-controller"
            }
        );
    }

    emitCommandCompleted(
        command,
        result = null
    ) {
        return this.eventBus.emit(
            RuntimeEventType.COMMAND_COMPLETED,
            {
                command,
                result
            },
            {
                source:
                    "runtime-controller"
            }
        );
    }

    emitSessionUpdated(
        session,
        reason =
            "runtime"
    ) {
        return this.eventBus.emit(
            RuntimeEventType.SESSION_UPDATED,
            {
                session,
                reason
            },
            {
                source:
                    "session-store"
            }
        );
    }

    emitBetRecorded(bet) {
        return this.eventBus.emit(
            RuntimeEventType.BET_RECORDED,
            {
                bet
            },
            {
                source:
                    "runtime-controller"
            }
        );
    }

    emitShoeChanged(shoe) {
        return this.eventBus.emit(
            RuntimeEventType.SHOE_CHANGED,
            {
                shoe
            },
            {
                source:
                    "runtime-controller"
            }
        );
    }

    emitWarning(
        message,
        details = null
    ) {
        return this.eventBus.emit(
            RuntimeEventType.WARNING,
            {
                message,
                details
            }
        );
    }

    unbind() {
        for (
            const unsubscribe of
            this.unsubscribers
        ) {
            unsubscribe();
        }

        this.unsubscribers =
            [];

        this.bound =
            false;

        return this;
    }

    destroy() {
        return this.unbind();
    }

    get summary() {
        return {
            version:
                RUNTIME_EVENT_BRIDGE_VERSION,

            bound:
                this.bound,

            subscriptionCount:
                this.unsubscribers.length
        };
    }
}
