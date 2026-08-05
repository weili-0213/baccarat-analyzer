/**
 * Baccarat Analyzer V8.2
 * casino/ai/evolution/MutationEngine.js
 */

export const MUTATION_ENGINE_VERSION = "8.2.0";

function clamp(value, min, max) {
    let next = value;

    if (Number.isFinite(min)) {
        next = Math.max(
            min,
            next
        );
    }

    if (Number.isFinite(max)) {
        next = Math.min(
            max,
            next
        );
    }

    return next;
}

export default class MutationEngine {
    constructor({
        rate = 0.1,
        magnitude = 0.05,
        random = Math.random
    } = {}) {
        this.rate =
            rate;

        this.magnitude =
            magnitude;

        this.random =
            random;
    }

    mutate(
        genome,
        schema = {}
    ) {
        const genes =
            { ...genome.genes };

        for (
            const [
                name,
                value
            ] of
            Object.entries(
                genes
            )
        ) {
            if (
                this.random() >
                this.rate
            ) {
                continue;
            }

            const definition =
                schema[name] ??
                {};

            if (
                Array.isArray(
                    definition.values
                ) &&
                definition.values
                    .length > 0
            ) {
                const index =
                    Math.floor(
                        this.random() *
                        definition.values.length
                    );

                genes[name] =
                    definition.values[
                        index
                    ];

                continue;
            }

            if (
                Number.isFinite(
                    value
                )
            ) {
                const direction =
                    this.random() <
                    0.5
                        ? -1
                        : 1;

                const step =
                    Number.isFinite(
                        definition.step
                    )
                        ? definition.step
                        : this.magnitude;

                genes[name] =
                    clamp(
                        value +
                        direction *
                        step,
                        definition.min,
                        definition.max
                    );
            }
        }

        return {
            ...genome,
            genes
        };
    }

    get summary() {
        return {
            version:
                MUTATION_ENGINE_VERSION,
            rate:
                this.rate,
            magnitude:
                this.magnitude
        };
    }
}
