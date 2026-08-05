/**
 * Baccarat Analyzer V8.1
 * casino/ai/self-improvement/ExperimentRunner.js
 */

export const EXPERIMENT_RUNNER_VERSION = "8.1.0";

export default class ExperimentRunner {
    constructor({
        runExperiment = null
    } = {}) {
        this.runExperiment =
            runExperiment ??
            (async ({
                experiment,
                context
            }) => ({
                metrics: {
                    ...context.current,
                    simulated:
                        true,
                    parameter:
                        experiment.parameter,
                    value:
                        experiment.after
                }
            }));
    }

    async run({
        experiment,
        context
    } = {}) {
        if (!experiment) {
            throw new TypeError(
                "ExperimentRunner requires experiment."
            );
        }

        const output =
            await this.runExperiment({
                experiment,
                context
            });

        return {
            experimentId:
                experiment.experimentId,
            experiment,
            output
        };
    }

    get summary() {
        return {
            version: EXPERIMENT_RUNNER_VERSION
        };
    }
}
