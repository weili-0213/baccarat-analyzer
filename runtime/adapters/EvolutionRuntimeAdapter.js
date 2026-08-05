/**
 * Baccarat Analyzer V8.2
 * runtime/adapters/EvolutionRuntimeAdapter.js
 */

export const EVOLUTION_RUNTIME_ADAPTER_VERSION = "8.2.0";

export default class EvolutionRuntimeAdapter {
    constructor({
        evolution
    } = {}) {
        if (
            !evolution ||
            typeof evolution.evolve !==
                "function"
        ) {
            throw new TypeError(
                "EvolutionRuntimeAdapter requires an EvolutionEngine-compatible object."
            );
        }

        this.evolution =
            evolution;
    }

    evolve(input = {}) {
        return this.evolution
            .evolve(
                input
            );
    }

    pause() {
        return this.evolution.pause();
    }

    resume() {
        return this.evolution.resume();
    }

    reset() {
        return this.evolution.reset();
    }

    destroy() {
        return this.evolution.destroy();
    }

    get summary() {
        return {
            version:
                EVOLUTION_RUNTIME_ADAPTER_VERSION,
            evolution:
                this.evolution.summary
        };
    }
}
