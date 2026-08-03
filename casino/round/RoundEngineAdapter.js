/**
 * Baccarat Analyzer V6.2
 * casino/round/RoundEngineAdapter.js
 *
 * Adapts RoundEngine to CasinoEngine's roundFactory contract.
 */

export const ROUND_ENGINE_ADAPTER_VERSION = "6.2.0";

export default class RoundEngineAdapter {
    constructor({
        roundEngine,
        shoe,
        shoeNumber,
        roundNumber,
        input = {}
    } = {}) {
        if (
            !roundEngine ||
            typeof roundEngine.run !==
                "function"
        ) {
            throw new TypeError(
                "RoundEngineAdapter requires roundEngine.run()."
            );
        }

        if (!shoe) {
            throw new TypeError(
                "RoundEngineAdapter requires a shoe."
            );
        }

        this.roundEngine =
            roundEngine;

        this.shoe =
            shoe;

        this.shoeNumber =
            shoeNumber;

        this.roundNumber =
            roundNumber;

        this.input = {
            ...input
        };

        this.completed =
            false;

        this.result =
            null;
    }

    async complete(input = {}) {
        if (this.completed) {
            return this.result;
        }

        this.result =
            await this.roundEngine.run({
                shoe:
                    this.shoe,

                shoeNumber:
                    this.shoeNumber,

                roundNumber:
                    this.roundNumber,

                metadata: {
                    ...this.input,
                    ...input
                },

                context: {
                    ...this.input,
                    ...input
                }
            });

        this.completed =
            true;

        return this.result;
    }

    cancel(reason) {
        return this.roundEngine.cancel(
            reason
        );
    }

    destroy() {
        this.roundEngine
            ?.destroy
            ?.();

        this.result = null;

        return this;
    }

    get summary() {
        return {
            version:
                ROUND_ENGINE_ADAPTER_VERSION,

            completed:
                this.completed,

            hasResult:
                Boolean(
                    this.result
                ),

            round:
                this.roundEngine.summary
        };
    }
}
