/**
 * Baccarat Analyzer V5.2
 * runtime/createRuntimeControllers.js
 */

import RuntimeController
    from "./controllers/RuntimeController.js";

import RoundController
    from "./controllers/RoundController.js";


export const RUNTIME_CONTROLLERS_VERSION = "5.2.0";


export default function createRuntimeControllers({
    runtime,
    requiredCards = 4,
    cardValidator = null,
    onStateChange = null,
    onError = null
} = {}) {
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
            onStateChange,
            onError
        });

    return {
        runtimeController,
        roundController
    };
}
