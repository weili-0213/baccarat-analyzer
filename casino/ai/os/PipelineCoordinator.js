/**
 * Baccarat Analyzer V9.0
 * casino/ai/os/PipelineCoordinator.js
 */
export const PIPELINE_COORDINATOR_VERSION = "9.0.0";

export default class PipelineCoordinator {
    constructor({
        facade
    } = {}) {
        if (!facade) {
            throw new TypeError(
                "PipelineCoordinator requires RuntimeFacade."
            );
        }

        this.facade = facade;
    }

    async run({
        steps = [],
        context = {}
    } = {}) {
        const outputs = {};
        const timeline = [];

        for (const step of steps) {
            const startedAt = Date.now();

            const input =
                typeof step.input === "function"
                    ? step.input({
                        context,
                        outputs
                    })
                    : (
                        step.input ??
                        context
                    );

            const output =
                await this.facade.invoke(
                    step.engineId,
                    step.method,
                    input
                );

            outputs[step.outputKey ?? step.engineId] =
                output;

            timeline.push({
                engineId: step.engineId,
                method: step.method,
                success:
                    output?.success !== false,
                startedAt,
                completedAt:
                    Date.now()
            });

            if (
                step.stopWhen &&
                step.stopWhen(output, outputs)
            ) {
                break;
            }
        }

        return {
            outputs,
            timeline
        };
    }

    get summary() {
        return {
            version: PIPELINE_COORDINATOR_VERSION
        };
    }
}
