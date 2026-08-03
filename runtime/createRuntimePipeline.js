/**
 * Baccarat Analyzer V5.5
 * runtime/createRuntimePipeline.js
 */

import RuntimePipeline
    from "./pipeline/RuntimePipeline.js";


export const RUNTIME_PIPELINE_FACTORY_VERSION = "5.5.0";


export default function createRuntimePipeline({
    eventBus = null,
    clock = () => Date.now(),
    stopOnError = true,
    stages = []
} = {}) {
    const pipeline =
        new RuntimePipeline({
            eventBus,
            clock,
            stopOnError
        });

    for (const stage of stages) {
        pipeline.register(stage);
    }

    return pipeline;
}
