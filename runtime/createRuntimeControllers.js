/**
 * Baccarat Analyzer V5.3
 * runtime/createRuntimeControllers.js
 */

import RuntimeController
    from "./controllers/RuntimeController.js";

import RoundController
    from "./controllers/RoundController.js";

import RuntimeEventBus
    from "./events/RuntimeEventBus.js";

import RuntimeEventBridge
    from "./events/RuntimeEventBridge.js";


export const RUNTIME_CONTROLLERS_VERSION = "5.3.0";


export default function createRuntimeControllers({
    runtime,
    eventBus = null,
    requiredCards = 4,
    cardValidator = null,
    onStateChange = null,
    onError = null,
    eventBusOptions = {}
} = {}) {
    const resolvedEventBus =
        eventBus ??
        new RuntimeEventBus(
            eventBusOptions
        );

    const roundController =
        new RoundController({
            requiredCards,
            validator:
                cardValidator
        });

    const runtimeController =
        new RuntimeController({
            runtime,
            roundController,
            eventBus:
                resolvedEventBus,
            onStateChange,
            onError
        });

    const eventBridge =
        new RuntimeEventBridge({
            eventBus:
                resolvedEventBus,
            runtime,
            controller:
                runtimeController
        });

    eventBridge.bindRuntime();

    return {
        runtimeController,
        roundController,
        eventBus:
            resolvedEventBus,
        eventBridge
    };
}
