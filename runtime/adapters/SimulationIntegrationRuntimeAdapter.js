/**
 * Baccarat Analyzer V9.3
 * Path: runtime/adapters/SimulationIntegrationRuntimeAdapter.js
 * Purpose: Exposes V9.3 simulation integration to Runtime and AI Operating System.
 */
export const SIMULATION_INTEGRATION_RUNTIME_ADAPTER_VERSION = "9.3.0";

export default class SimulationIntegrationRuntimeAdapter {
    constructor({ integration } = {}) {
        if (!integration || typeof integration.run !== "function") {
            throw new TypeError(
                "SimulationIntegrationRuntimeAdapter requires AISimulationIntegration."
            );
        }
        this.integration = integration;
    }

    run(input = {}) {
        return this.integration.run(input);
    }

    simulate(input = {}) {
        return this.integration.run(input);
    }

    pause() {
        return this.integration.pause();
    }

    resume() {
        return this.integration.resume();
    }

    reset() {
        return this.integration.reset();
    }

    destroy() {
        return this.integration.destroy();
    }

    get summary() {
        return {
            version: SIMULATION_INTEGRATION_RUNTIME_ADAPTER_VERSION,
            integration: this.integration.summary
        };
    }
}
