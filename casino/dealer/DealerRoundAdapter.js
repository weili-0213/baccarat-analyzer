/**
 * Baccarat Analyzer V6.1
 * casino/dealer/DealerRoundAdapter.js
 *
 * Exposes DealerEngine as a Round-compatible object for CasinoEngine.
 */

export const DEALER_ROUND_ADAPTER_VERSION = "6.1.0";

export default class DealerRoundAdapter {
    constructor({
        dealer,
        shoe,
        context = {}
    } = {}) {
        if (
            !dealer ||
            typeof dealer.run !==
                "function"
        ) {
            throw new TypeError(
                "DealerRoundAdapter requires dealer.run()."
            );
        }

        if (!shoe) {
            throw new TypeError(
                "DealerRoundAdapter requires a shoe."
            );
        }

        this.dealer = dealer;
        this.shoe = shoe;
        this.context = context;
        this.completed = false;
        this.result = null;
    }

    async draw(target = null) {
        return this.dealer.dealCard({
            shoe:
                this.shoe,
            side:
                target,
            position:
                null
        });
    }

    async complete(input = {}) {
        if (this.completed) {
            return this.result;
        }

        this.result =
            await this.dealer.run({
                shoe:
                    this.shoe,
                context: {
                    ...this.context,
                    ...input
                }
            });

        this.completed = true;

        return this.result;
    }

    destroy() {
        this.dealer
            ?.destroy
            ?.();

        this.result = null;

        return this;
    }

    get summary() {
        return {
            version:
                DEALER_ROUND_ADAPTER_VERSION,

            completed:
                this.completed,

            hasResult:
                Boolean(
                    this.result
                ),

            dealer:
                this.dealer.summary
        };
    }
}
