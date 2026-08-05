/**
 * Baccarat Analyzer V9.4
 * Path: integration/prediction/TrendPredictionGateway.js
 * Purpose: Adapts the existing trend predictor.
 */

export const TREND_PREDICTION_GATEWAY_VERSION = "9.4.0";

export default class TrendPredictionGateway {
    constructor({ predictor } = {}) {
        if (
            !predictor ||
            typeof predictor.predict !==
                "function"
        ) {
            throw new TypeError(
                "TrendPredictionGateway requires predictor.predict()."
            );
        }

        this.predictor =
            predictor;
    }

    async predict(input = {}) {
        return this.predictor
            .predict(
                input
            );
    }

    get summary() {
        return {
            version:
                TREND_PREDICTION_GATEWAY_VERSION
        };
    }
}
